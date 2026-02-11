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
        const body = await req.json();
        const { subscription, userAgent, email } = body;

        if (!subscription || !subscription.endpoint) {
            return new Response(JSON.stringify({ 
                error: 'Invalid subscription data' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

        // Ensure table exists
        await sql`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255),
                endpoint TEXT NOT NULL UNIQUE,
                p256dh_key TEXT NOT NULL,
                auth_key TEXT NOT NULL,
                user_agent TEXT,
                is_active BOOLEAN DEFAULT true,
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_notification_at TIMESTAMP
            )
        `;

        // Extract user email from header or body
        const userEmail = req.headers.get('x-user-email') || email || null;

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
