import { neon } from '@neondatabase/serverless';
import { verifyPasswordSimple as verifyPassword } from '../lib/password-hash.js';

export const config = {
    runtime: 'edge'
};

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

export default async function handler(req) {
    if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Admin authentication
    const adminEmail = req.headers.get('x-admin-email');
    const adminPassword = req.headers.get('x-admin-password');

    if (adminEmail !== CEO_EMAIL) {
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

    try {
        const sql = neon(process.env.DATABASE_URL);

        // Get all users with their progress
        let users = [];
        try {
            users = await sql`
                SELECT 
                    email,
                    name,
                    created_at,
                    has_paid,
                    pyramid_unlocked,
                    eye_unlocked,
                    chat_unlocked,
                    chat_ready,
                    is_blocked
                FROM users
                ORDER BY created_at DESC
            `;
        } catch (dbError) {
            console.error('Database query error:', dbError);
            // Return empty data if query fails
            return new Response(JSON.stringify({
                users: [],
                total: 0,
                paid: 0,
                active: 0,
                error: 'Database query failed'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Calculate stats
        const total = users.length;
        const paid = users.filter(u => u.has_paid).length;
        const active = 0; // Simplified for now

        return new Response(JSON.stringify({
            users: users || [],
            total,
            paid,
            active
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin users error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to load users',
            message: 'Internal server error',
            users: [],
            total: 0,
            paid: 0,
            active: 0
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
