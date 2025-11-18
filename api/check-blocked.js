import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({ blocked: false }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        const sql = neon(dbUrl);

        // Check if user is blocked
        const result = await sql`
            SELECT is_blocked FROM users WHERE email = ${email}
            LIMIT 1
        `;

        const isBlocked = result.length > 0 && result[0].is_blocked === true;

        return new Response(JSON.stringify({ blocked: isBlocked }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Check blocked error:', error);
        return new Response(JSON.stringify({ blocked: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
