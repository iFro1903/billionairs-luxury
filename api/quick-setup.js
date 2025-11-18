import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    try {
        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        const sql = neon(dbUrl);

        // Create users table with ALL columns
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                password_hash TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                has_paid BOOLEAN DEFAULT false,
                pyramid_unlocked BOOLEAN DEFAULT false,
                eye_unlocked BOOLEAN DEFAULT false,
                chat_ready BOOLEAN DEFAULT false,
                payment_status VARCHAR(50) DEFAULT 'pending',
                payment_method VARCHAR(50),
                is_blocked BOOLEAN DEFAULT false,
                last_seen TIMESTAMP,
                full_name VARCHAR(255),
                phone VARCHAR(50),
                company VARCHAR(255)
            )
        `;

        // Create test users
        const testUsers = [
            { email: 'test1@billionairs.luxury', name: 'Test User 1', password_hash: 'test123' },
            { email: 'test2@billionairs.luxury', name: 'Test User 2', password_hash: 'test123' }
        ];

        let created = 0;
        for (const user of testUsers) {
            try {
                await sql`
                    INSERT INTO users (email, name, password_hash, is_blocked)
                    VALUES (${user.email}, ${user.name}, ${user.password_hash}, false)
                    ON CONFLICT (email) DO NOTHING
                `;
                created++;
            } catch (e) {
                console.error(`Error creating ${user.email}:`, e);
            }
        }

        // Get all users
        const allUsers = await sql`SELECT email, name, created_at FROM users ORDER BY created_at DESC`;

        return new Response(JSON.stringify({ 
            success: true,
            message: `Setup complete! Created ${created} new test users.`,
            total_users: allUsers.length,
            users: allUsers,
            credentials: {
                email: 'test1@billionairs.luxury or test2@billionairs.luxury',
                password: 'test123'
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Setup error:', error);
        return new Response(JSON.stringify({ 
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
