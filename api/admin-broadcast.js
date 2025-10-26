/**
 * Admin Broadcast Push Notification API
 * Send push notifications to all subscribed users
 */

import { neon } from '@neondatabase/serverless';
import webpush from 'web-push';

export const config = {
    runtime: 'edge'
};

// Configure VAPID details
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:billionairsofficial@gmail.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Admin authentication check
    const adminEmail = req.headers.get('x-admin-email');
    const adminPassword = req.headers.get('x-admin-password');

    if (adminEmail !== 'billionairsofficial@gmail.com' || adminPassword !== 'Masallah1,') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { title, message, url, icon, targetAudience } = await req.json();

        if (!title || !message) {
            return new Response(JSON.stringify({ 
                error: 'Title and message are required' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(process.env.DATABASE_URL);

        // Get target subscriptions
        let subscriptions;
        
        switch (targetAudience) {
            case 'paid':
                // Only paid users
                subscriptions = await sql`
                    SELECT ps.* 
                    FROM push_subscriptions ps
                    INNER JOIN users u ON ps.user_email = u.email
                    WHERE ps.is_active = true 
                        AND u.payment_status = 'paid'
                `;
                break;

            case 'unpaid':
                // Only unpaid users
                subscriptions = await sql`
                    SELECT ps.* 
                    FROM push_subscriptions ps
                    INNER JOIN users u ON ps.user_email = u.email
                    WHERE ps.is_active = true 
                        AND (u.payment_status IS NULL OR u.payment_status != 'paid')
                `;
                break;

            case 'all':
            default:
                // All active subscriptions
                subscriptions = await sql`
                    SELECT * FROM push_subscriptions 
                    WHERE is_active = true
                `;
                break;
        }

        if (subscriptions.length === 0) {
            return new Response(JSON.stringify({ 
                success: true,
                message: 'No active subscriptions found',
                sent: 0,
                failed: 0
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Prepare notification payload
        const notificationPayload = JSON.stringify({
            title: title,
            message: message,
            body: message,
            icon: icon || '/assets/images/icon-192x192.png',
            badge: '/assets/images/icon-72x72.png',
            url: url || '/',
            timestamp: Date.now(),
            tag: 'admin-broadcast'
        });

        // Send notifications
        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh_key,
                            auth: sub.auth_key
                        }
                    };

                    await webpush.sendNotification(pushSubscription, notificationPayload);

                    // Update last_notification_at
                    await sql`
                        UPDATE push_subscriptions 
                        SET last_notification_at = NOW() 
                        WHERE id = ${sub.id}
                    `;

                    return { success: true, subscriptionId: sub.id };
                } catch (error) {
                    // Handle expired subscriptions
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await sql`
                            UPDATE push_subscriptions 
                            SET is_active = false 
                            WHERE id = ${sub.id}
                        `;
                    }
                    
                    return { 
                        success: false, 
                        subscriptionId: sub.id, 
                        error: error.message 
                    };
                }
            })
        );

        const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.filter(r => r.status === 'rejected' || !r.value.success).length;

        // Log to audit
        await sql`
            INSERT INTO audit_logs (action, user_email, details, ip_address)
            VALUES (
                'broadcast_notification',
                ${adminEmail},
                ${JSON.stringify({ title, message, sent, failed, targetAudience })},
                ${req.headers.get('x-forwarded-for') || 'unknown'}
            )
        `;

        return new Response(JSON.stringify({
            success: true,
            message: 'Broadcast notification sent',
            sent: sent,
            failed: failed,
            total: subscriptions.length,
            details: {
                title: title,
                message: message,
                targetAudience: targetAudience || 'all'
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Broadcast notification error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to send broadcast notification',
            message: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
