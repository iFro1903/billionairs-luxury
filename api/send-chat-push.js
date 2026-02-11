/**
 * Send Chat Push Notifications API
 * Called internally when a new chat message is sent
 * Node.js runtime (needed for web-push npm package)
 */

import { neon } from '@neondatabase/serverless';
import webpush from 'web-push';

export const config = {
    runtime: 'nodejs'
};

// Configure VAPID
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

    try {
        const { senderUsername, messageText, senderEmail } = await req.json();

        if (!senderUsername) {
            return new Response(JSON.stringify({ error: 'Missing sender info' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'VAPID keys not configured' 
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

        // Get all active push subscriptions (exclude sender)
        let subscriptions;
        if (senderEmail) {
            subscriptions = await sql`
                SELECT id, endpoint, p256dh_key, auth_key 
                FROM push_subscriptions 
                WHERE is_active = true 
                AND (user_email IS NULL OR user_email != ${senderEmail})
            `;
        } else {
            subscriptions = await sql`
                SELECT id, endpoint, p256dh_key, auth_key 
                FROM push_subscriptions 
                WHERE is_active = true
            `;
        }

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ 
                success: true, 
                sent: 0, 
                message: 'No subscribers' 
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Truncate message for notification
        const shortMessage = messageText 
            ? (messageText.length > 80 ? messageText.substring(0, 80) + '…' : messageText)
            : 'Sent a file';

        const payload = JSON.stringify({
            title: `${senderUsername} · The Inner Circle`,
            body: shortMessage,
            message: shortMessage,
            icon: '/assets/images/icon-192x192.png',
            badge: '/assets/images/icon-72x72.png',
            tag: 'chat-message',
            url: '/',
            data: { type: 'chat_message' },
            timestamp: Date.now()
        });

        let sent = 0;
        let failed = 0;

        // Send to all subscribers
        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    const pushSub = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh_key,
                            auth: sub.auth_key
                        }
                    };

                    await webpush.sendNotification(pushSub, payload);
                    sent++;
                    return { success: true };
                } catch (error) {
                    // Deactivate expired/invalid subscriptions
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await sql`
                            UPDATE push_subscriptions 
                            SET is_active = false 
                            WHERE id = ${sub.id}
                        `;
                    }
                    failed++;
                    return { success: false, error: error.message };
                }
            })
        );

        console.log(`Chat push: ${sent} sent, ${failed} failed out of ${subscriptions.length}`);

        return new Response(JSON.stringify({ 
            success: true, 
            sent, 
            failed, 
            total: subscriptions.length 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('send-chat-push error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to send push notifications',
            message: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
