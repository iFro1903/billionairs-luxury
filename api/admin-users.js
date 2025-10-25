import { neon } from '@neondatabase/serverless';

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

    try {
        const sql = neon(process.env.DATABASE_URL);

        // Get all users with their progress
        const users = await sql`
            SELECT 
                email,
                name,
                created_at,
                has_paid,
                pyramid_unlocked,
                eye_unlocked,
                eye_opened_at,
                chat_ready,
                last_seen
            FROM users
            ORDER BY created_at DESC
        `;

        // Calculate stats
        const total = users.length;
        const paid = users.filter(u => u.has_paid).length;
        
        // Active users (seen in last 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const active = users.filter(u => 
            u.last_seen && new Date(u.last_seen) > yesterday
        ).length;

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
            message: error.message,
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
