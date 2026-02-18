import { neon } from '@neondatabase/serverless';
import { verifyAdminSession } from '../lib/verify-admin.js';

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

    try {
        // Admin authentication (cookie + legacy header fallback)
        const auth = await verifyAdminSession(req);
        if (!auth.authorized) return auth.response;

        const { email, unlock } = await req.json();
        const sql = neon(process.env.DATABASE_URL);

        if (unlock === 'reset') {
            // Reset all progress
            await sql`
                UPDATE users 
                SET pyramid_unlocked = false,
                    eye_unlocked = false,
                    eye_opened_at = NULL,
                    chat_ready = false,
                    chat_opened_at = NULL
                WHERE LOWER(email) = ${email.toLowerCase()}
            `;
        } else if (unlock === 'pyramid') {
            await sql`
                UPDATE users 
                SET pyramid_unlocked = true
                WHERE LOWER(email) = ${email.toLowerCase()}
            `;
        } else if (unlock === 'eye') {
            await sql`
                UPDATE users 
                SET pyramid_unlocked = true,
                    eye_unlocked = true,
                    eye_opened_at = NOW()
                WHERE LOWER(email) = ${email.toLowerCase()}
            `;
        } else if (unlock === 'chat') {
            await sql`
                UPDATE users 
                SET pyramid_unlocked = true,
                    eye_unlocked = true,
                    eye_opened_at = NOW(),
                    chat_ready = true
                WHERE LOWER(email) = ${email.toLowerCase()}
            `;
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin unlock error:', error);
        return new Response(JSON.stringify({ error: 'Failed to unlock' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
