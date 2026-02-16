import { neon } from '@neondatabase/serverless';
import { verifyPasswordSimple as verifyPassword } from '../lib/password-hash.js';

export const config = {
    runtime: 'edge'
};

const ADMIN_EMAIL = 'furkan_akaslan@hotmail.com';

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

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

        const { email } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        const sql = neon(dbUrl);

        // Check if 2FA exists for this user
        const existing = await sql`
            SELECT id, enabled FROM two_factor_auth WHERE user_email = ${email}
        `;

        if (existing.length === 0) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: '2FA ist nicht aktiviert fuer diesen User' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Disable 2FA and remove secret
        await sql`
            UPDATE two_factor_auth 
            SET enabled = false, secret = NULL, backup_codes = NULL
            WHERE user_email = ${email}
        `;

        console.log(`[ADMIN] 2FA reset for user: ${email} by admin: ${adminEmail}`);

        return new Response(JSON.stringify({ 
            success: true, 
            message: `2FA fuer ${email} wurde zurueckgesetzt` 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin reset 2FA error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
