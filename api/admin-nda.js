// Admin API - Get NDA Signature for a specific user
import { neon } from '@neondatabase/serverless';
import { verifyPasswordSimple as verifyPassword } from '../lib/password-hash.js';

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

    // Admin authentication
    const adminEmail = req.headers.get('x-admin-email');
    const adminPassword = req.headers.get('x-admin-password');

    if (adminEmail !== CEO_EMAIL) {
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

    try {
        const url = new URL(req.url);
        const email = url.searchParams.get('email');

        if (!email) {
            return new Response(JSON.stringify({ success: false, error: 'Email parameter required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(process.env.DATABASE_URL);

        // Check if nda_signatures table exists
        let tableExists = false;
        try {
            const check = await sql`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'nda_signatures'
                )
            `;
            tableExists = check[0]?.exists;
        } catch (e) {
            tableExists = false;
        }

        if (!tableExists) {
            return new Response(JSON.stringify({ success: true, nda: null, message: 'No NDA signatures table' }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get the latest NDA signature for this email
        const result = await sql`
            SELECT signature_id, full_name, email, phone, company, 
                    signature_data, document_ref, ip_address, 
                    agreed_at, created_at
            FROM nda_signatures 
            WHERE LOWER(email) = LOWER(${email}) 
            ORDER BY created_at DESC 
            LIMIT 1
        `;

        if (result.length === 0) {
            return new Response(JSON.stringify({ success: true, nda: null }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: true, nda: result[0] }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin NDA fetch error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
