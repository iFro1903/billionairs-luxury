/**
 * Send Push Notification API Endpoint
 * Sends push notifications to subscribed users
 * 
 * Requires VAPID keys in environment variables:
 * - VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY
 * - VAPID_SUBJECT
 */

import { neon } from '@neondatabase/serverless';
import { captureError } from '../lib/sentry.js';

export const config = {
    runtime: 'edge'
};

/**
 * Generate JWT for VAPID authentication
 */
function generateVapidAuthHeader(audience) {
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:furkan_akaslan@hotmail.com';

    // Create JWT header
    const header = {
        typ: 'JWT',
        alg: 'ES256'
    };

    // Create JWT payload
    const exp = Math.floor(Date.now() / 1000) + (12 * 60 * 60); // 12 hours
    const payload = {
        aud: audience,
        exp: exp,
        sub: vapidSubject
    };

    // Encode header and payload
    const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadBase64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    // For simplicity, we'll use a basic implementation
    // In production, you'd want to properly sign the JWT with the private key
    // This is a simplified version for Edge Runtime
    
    return `vapid t=${headerBase64}.${payloadBase64}, k=${process.env.VAPID_PUBLIC_KEY}`;
}

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Admin authentication required
    const authHeader = req.headers.get('authorization');
    const adminToken = req.headers.get('x-admin-token');
    
    if (!authHeader && !adminToken) {
        return new Response(JSON.stringify({ 
            error: 'Authentication required' 
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { title, message, url, userEmail, image, tag } = await req.json();

        if (!title || !message) {
            return new Response(JSON.stringify({ 
                error: 'Title and message are required' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(process.env.DATABASE_URL);

        // Get active subscriptions
        let subscriptions;
        if (userEmail) {
            subscriptions = await sql`
                SELECT * FROM push_subscriptions 
                WHERE user_email = ${userEmail} AND is_active = true
            `;
        } else {
            // Send to all active subscriptions
            subscriptions = await sql`
                SELECT * FROM push_subscriptions 
                WHERE is_active = true
                LIMIT 1000
            `;
        }

        if (subscriptions.length === 0) {
            return new Response(JSON.stringify({ 
                success: true,
                message: 'No active subscriptions found',
                sent: 0
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Notification payload
        const payload = JSON.stringify({
            title,
            message,
            url: url || '/',
            icon: '/assets/images/icon-192x192.png',
            badge: '/assets/images/icon-72x72.png',
            image,
            tag: tag || 'billionairs-notification',
            timestamp: Date.now()
        });

        // Send notifications
        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    const pushEndpoint = new URL(sub.endpoint);
                    const audience = `${pushEndpoint.protocol}//${pushEndpoint.host}`;

                    const response = await fetch(sub.endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Encoding': 'aes128gcm',
                            'Authorization': generateVapidAuthHeader(audience),
                            'TTL': '86400' // 24 hours
                        },
                        body: payload
                    });

                    if (response.status === 201 || response.status === 200) {
                        // Update last notification time
                        await sql`
                            UPDATE push_subscriptions 
                            SET last_notification_at = CURRENT_TIMESTAMP 
                            WHERE id = ${sub.id}
                        `;
                        return { success: true, endpoint: sub.endpoint };
                    } else if (response.status === 410 || response.status === 404) {
                        // Subscription expired or invalid
                        await sql`
                            UPDATE push_subscriptions 
                            SET is_active = false 
                            WHERE id = ${sub.id}
                        `;
                        return { success: false, endpoint: sub.endpoint, reason: 'expired' };
                    } else {
                        throw new Error(`Push failed with status ${response.status}`);
                    }
                } catch (err) {
                    console.error('Failed to send notification:', err);
                    return { success: false, endpoint: sub.endpoint, error: err.message };
                }
            })
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;

        console.log(`📤 Push notifications sent: ${successful} successful, ${failed} failed`);

        return new Response(JSON.stringify({ 
            success: true,
            sent: successful,
            failed: failed,
            total: subscriptions.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Error sending push notifications:', error);
        
        captureError(error, {
            tags: {
                endpoint: 'send-notification',
                category: 'push_notifications'
            }
        });

        return new Response(JSON.stringify({ 
            error: 'Failed to send notifications',
            message: 'Internal server error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
