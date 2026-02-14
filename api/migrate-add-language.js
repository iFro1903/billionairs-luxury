// Migration: Add preferred_language column to users table
import { neon } from '@neondatabase/serverless';
import { verifyPasswordSimple } from '../lib/password-hash.js';

export const config = { runtime: 'edge' };

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Email, X-Admin-Password' } });
    }

    const adminEmail = (req.headers.get('x-admin-email') || '').trim();
    const adminPassword = (req.headers.get('x-admin-password') || '').trim();

    if (adminEmail.toLowerCase() !== CEO_EMAIL) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!hash || !(await verifyPasswordSimple(adminPassword, hash))) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const sql = neon(process.env.DATABASE_URL);

        // Add preferred_language column if not exists
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en'`;

        return new Response(JSON.stringify({ success: true, message: 'preferred_language column added to users table' }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Migration error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}
