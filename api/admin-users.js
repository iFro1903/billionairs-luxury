import { neon } from '@neondatabase/serverless';
import { verifyAdminSession } from '../lib/verify-admin.js';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Admin authentication (cookie + legacy header fallback)
        const auth = await verifyAdminSession(req);
        if (!auth.authorized) return auth.response;

        const sql = neon(process.env.DATABASE_URL);

        // Get all users with their progress
        // Use SELECT * to avoid errors from missing columns
        let users = [];
        try {
            users = await sql`
                SELECT u.*, 
                    COALESCE(tfa.enabled, false) as twofa_enabled
                FROM users u
                LEFT JOIN two_factor_auth tfa ON u.email = tfa.user_email
                ORDER BY u.created_at DESC
            `;
        } catch (dbError) {
            console.error('Database query error:', dbError);
            return new Response(JSON.stringify({
                users: [],
                total: 0,
                paid: 0,
                active: 0,
                error: 'Database query failed: ' + dbError.message
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Normalize user data (handle missing columns gracefully)
        users = users.map(u => ({
            email: u.email || '',
            name: u.name || '',
            full_name: u.full_name || u.name || '',
            created_at: u.created_at || null,
            has_paid: u.has_paid || false,
            payment_status: u.payment_status || 'pending',
            paid_at: u.paid_at || null,
            last_seen: u.last_seen || null,
            pyramid_unlocked: u.pyramid_unlocked || false,
            eye_unlocked: u.eye_unlocked || false,
            chat_unlocked: u.chat_unlocked || false,
            chat_ready: u.chat_ready || false,
            is_blocked: u.is_blocked || false,
            twofa_enabled: u.twofa_enabled || false
        }));

        // Calculate stats
        const total = users.length;
        const paid = users.filter(u => u.has_paid).length;
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        const active = users.filter(u => u.last_seen && new Date(u.last_seen) > fiveMinAgo).length;

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
