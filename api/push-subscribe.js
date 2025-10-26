/**
 * Push Subscription API Endpoint
 * Saves push notification subscriptions to database
 */

import { neon } from '@neondatabase/serverless';
import { captureError } from '../lib/sentry.js';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Simple rate limiting ohne IP-Block Check (da öffentlicher Endpoint)
    // Limitierung erfolgt durch Neon DB Connection Limits

    try {
        const { subscription, userAgent } = await req.json();

        if (!subscription || !subscription.endpoint) {
            return new Response(JSON.stringify({ 
                error: 'Invalid subscription data' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(process.env.DATABASE_URL);

        // Extract user email from session if available
        const userEmail = req.headers.get('x-user-email') || null;

        // Save subscription to database
        await sql`
            INSERT INTO push_subscriptions (
                user_email,
                endpoint,
                p256dh_key,
                auth_key,
                user_agent
            ) VALUES (
                ${userEmail},
                ${subscription.endpoint},
                ${subscription.keys.p256dh},
                ${subscription.keys.auth},
                ${userAgent || null}
            )
            ON CONFLICT (endpoint) 
            DO UPDATE SET
                user_email = EXCLUDED.user_email,
                p256dh_key = EXCLUDED.p256dh_key,
                auth_key = EXCLUDED.auth_key,
                user_agent = EXCLUDED.user_agent,
                is_active = true,
                subscribed_at = CURRENT_TIMESTAMP
        `;

        console.log('✅ Push subscription saved:', subscription.endpoint.substring(0, 50) + '...');

        return new Response(JSON.stringify({ 
            success: true,
            message: 'Subscription saved successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Error saving push subscription:', error);
        
        captureError(error, {
            tags: {
                endpoint: 'push-subscribe',
                category: 'push_notifications'
            },
            extra: {
                method: req.method
            }
        });

        return new Response(JSON.stringify({ 
            error: 'Failed to save subscription',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
