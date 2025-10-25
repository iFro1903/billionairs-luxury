import { neon } from '@neondatabase/serverless';

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
        const sql = neon(process.env.DATABASE_URL);

        const users = await sql`SELECT * FROM users`;

        const stats = {
            registered: users.length,
            paid: users.filter(u => u.has_paid).length,
            pyramid: users.filter(u => u.pyramid_unlocked).length,
            eye: users.filter(u => u.eye_unlocked).length,
            chat: users.filter(u => u.chat_ready).length
        };

        return new Response(JSON.stringify(stats), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        return new Response(JSON.stringify({ 
            registered: 0, paid: 0, pyramid: 0, eye: 0, chat: 0 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
