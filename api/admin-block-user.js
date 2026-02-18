import { neon } from '@neondatabase/serverless';
import { verifyAdminSession, CEO_EMAIL } from '../lib/verify-admin.js';

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

        const { email, action } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Prevent blocking the CEO
        if (email === CEO_EMAIL) {
            return new Response(JSON.stringify({ error: 'Cannot block CEO account' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const adminEmail = auth.email;
        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        const sql = neon(dbUrl);

        // Create blocked_users table if not exists
        await sql`
            CREATE TABLE IF NOT EXISTS blocked_users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                blocked_at TIMESTAMP DEFAULT NOW(),
                blocked_by VARCHAR(255),
                reason TEXT
            )
        `;

        // Ensure is_blocked column exists on users table
        try {
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false`;
        } catch (_) { /* column likely exists */ }

        if (action === 'block') {
            // Block the user
            await sql`
                INSERT INTO blocked_users (email, blocked_by, reason)
                VALUES (${email}, ${adminEmail}, 'Blocked by admin')
                ON CONFLICT (email) DO NOTHING
            `;

            // Update user status
            await sql`
                UPDATE users 
                SET is_blocked = true
                WHERE email = ${email}
            `;

            // Log the action
            await sql`
                INSERT INTO audit_logs (action, user_email, ip, details)
                VALUES ('USER_BLOCKED', ${email}, ${req.headers.get('x-forwarded-for') || 'unknown'}, ${JSON.stringify({ blocked_by: adminEmail })})
            `;

            return new Response(JSON.stringify({ 
                success: true,
                message: `User ${email} has been blocked`
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } 
        
        if (action === 'unblock') {
            // Unblock the user
            await sql`
                DELETE FROM blocked_users
                WHERE email = ${email}
            `;

            // Update user status
            await sql`
                UPDATE users 
                SET is_blocked = false
                WHERE email = ${email}
            `;

            // Log the action
            await sql`
                INSERT INTO audit_logs (action, user_email, ip, details)
                VALUES ('USER_UNBLOCKED', ${email}, ${req.headers.get('x-forwarded-for') || 'unknown'}, ${JSON.stringify({ unblocked_by: adminEmail })})
            `;

            return new Response(JSON.stringify({ 
                success: true,
                message: `User ${email} has been unblocked`
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Block user error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to block/unblock user',
            message: error.message,
            stack: error.stack?.substring(0, 300)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
