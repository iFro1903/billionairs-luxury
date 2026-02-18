// Admin: Save/Load Member Notes
import { neon } from '@neondatabase/serverless';
import { verifyAdminSession } from '../lib/verify-admin.js';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    try {
        // Admin authentication (cookie + legacy header fallback)
        const auth = await verifyAdminSession(req);
        if (!auth.authorized) return auth.response;
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Auth error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const sql = neon(process.env.DATABASE_URL);

    if (req.method === 'POST') {
        try {
            const { email, notes } = await req.json();
            if (!email) {
                return new Response(JSON.stringify({ error: 'Email required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Try to add admin_notes column if it doesn't exist
            try {
                await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT ''`;
            } catch (e) {
                // Column might already exist, continue
            }

            await sql`UPDATE users SET admin_notes = ${notes || ''} WHERE email = ${email}`;

            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Save notes error:', error);
            return new Response(JSON.stringify({ error: 'Failed to save notes' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    if (req.method === 'GET') {
        try {
            const url = new URL(req.url);
            const email = url.searchParams.get('email');
            if (!email) {
                return new Response(JSON.stringify({ error: 'Email required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            let notes = '';
            try {
                const result = await sql`SELECT admin_notes FROM users WHERE email = ${email}`;
                if (result.length > 0) {
                    notes = result[0].admin_notes || '';
                }
            } catch (e) {
                // Column might not exist yet
            }

            return new Response(JSON.stringify({ success: true, notes }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Load notes error:', error);
            return new Response(JSON.stringify({ error: 'Failed to load notes' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
    });
}
