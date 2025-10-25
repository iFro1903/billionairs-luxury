import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge'
};

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { email, mode } = await req.json();

        // CEO only
        if (email.toLowerCase() !== CEO_EMAIL.toLowerCase()) {
            return new Response(JSON.stringify({ error: 'Access denied' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(process.env.DATABASE_URL);

        // Create emergency_mode table if it doesn't exist
        await sql`
            CREATE TABLE IF NOT EXISTS emergency_mode (
                id INTEGER PRIMARY KEY DEFAULT 1,
                is_active BOOLEAN DEFAULT false,
                activated_at TIMESTAMP,
                activated_by TEXT,
                reason TEXT
            )
        `;

        // Check if row exists
        const existing = await sql`SELECT * FROM emergency_mode WHERE id = 1`;
        
        if (existing.length === 0) {
            // Create initial row
            await sql`INSERT INTO emergency_mode (id, is_active) VALUES (1, false)`;
        }

        // Update mode
        if (mode === 'activate') {
            await sql`
                UPDATE emergency_mode 
                SET is_active = true,
                    activated_at = NOW(),
                    activated_by = ${email},
                    reason = 'CEO manual activation'
                WHERE id = 1
            `;
        } else if (mode === 'deactivate') {
            await sql`
                UPDATE emergency_mode 
                SET is_active = false,
                    activated_at = NULL,
                    activated_by = NULL,
                    reason = NULL
                WHERE id = 1
            `;
        }

        return new Response(JSON.stringify({ success: true, mode }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Emergency mode error:', error);
        return new Response(JSON.stringify({ error: 'Failed to update emergency mode' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
