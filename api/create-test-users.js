import { neon } from '@neondatabase/serverless';
import { verifyPasswordSimple as verifyPassword } from '../lib/password-hash.js';

export const config = {
    runtime: 'edge'
};

const ADMIN_EMAIL = 'furkan_akaslan@hotmail.com';

export default async function handler(req) {
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

        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        const sql = neon(dbUrl);

        // Create test users
        const testUsers = [
            {
                email: 'test1@billionairs.luxury',
                name: 'Test User 1',
                password_hash: 'test123' // In production, this should be hashed
            },
            {
                email: 'test2@billionairs.luxury',
                name: 'Test User 2',
                password_hash: 'test123'
            }
        ];

        const created = [];

        for (const user of testUsers) {
            try {
                await sql`
                    INSERT INTO users (
                        email, 
                        name, 
                        password_hash,
                        created_at,
                        pyramid_unlocked,
                        eye_unlocked,
                        chat_ready,
                        has_paid,
                        is_blocked
                    )
                    VALUES (
                        ${user.email},
                        ${user.name},
                        ${user.password_hash},
                        NOW(),
                        false,
                        false,
                        false,
                        false,
                        false
                    )
                    ON CONFLICT (email) DO NOTHING
                `;
                created.push(user.email);
            } catch (e) {
                console.error(`Error creating ${user.email}:`, e);
            }
        }

        return new Response(JSON.stringify({ 
            success: true,
            message: `Created ${created.length} test users`,
            users: created,
            credentials: {
                email: 'test1@billionairs.luxury or test2@billionairs.luxury',
                password: 'test123'
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create test users error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to create test users',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
