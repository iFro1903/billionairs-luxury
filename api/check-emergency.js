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

        // Check if emergency mode is active
        const result = await sql`
            SELECT is_active FROM emergency_mode WHERE id = 1
        `;

        const isActive = result.length > 0 ? result[0].is_active : false;

        return new Response(JSON.stringify({ isActive }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        // If table doesn't exist or error, assume not active
        return new Response(JSON.stringify({ isActive: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
