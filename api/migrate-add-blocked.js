import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    try {
        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        const sql = neon(dbUrl);

        // Add is_blocked column to users table
        await sql`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false
        `;

        // Create blocked_users table
        await sql`
            CREATE TABLE IF NOT EXISTS blocked_users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                blocked_at TIMESTAMP DEFAULT NOW(),
                blocked_by VARCHAR(255),
                reason TEXT
            )
        `;

        // Create index for faster lookups
        await sql`
            CREATE INDEX IF NOT EXISTS idx_users_blocked ON users(is_blocked)
        `;

        return new Response(JSON.stringify({ 
            success: true,
            message: 'Database updated successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Migration error:', error);
        return new Response(JSON.stringify({ 
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
