import { neon } from '@neondatabase/serverless';
import { verifyPasswordSimple as verifyPassword } from '../lib/password-hash.js';

export const config = {
    runtime: 'edge'
};

const ADMIN_EMAIL = 'furkan_akaslan@hotmail.com';

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Admin authentication
        const adminEmail = req.headers.get('x-admin-email');
        const adminPassword = req.headers.get('x-admin-password');

        if (adminEmail !== ADMIN_EMAIL) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!passwordHash || !(await verifyPassword(adminPassword, passwordHash))) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { email, action } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Prevent blocking the CEO
        if (email === ADMIN_EMAIL) {
            return new Response(JSON.stringify({ error: 'Cannot block CEO account' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
