// Admin: Update Member Payment Status
import { neon } from '@neondatabase/serverless';
import { verifyAdminSession } from '../lib/verify-admin.js';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Admin authentication (cookie + legacy header fallback)
        const auth = await verifyAdminSession(req);
        if (!auth.authorized) return auth.response;

        const { email, status } = await req.json();

        if (!email || !status) {
            return new Response(JSON.stringify({ error: 'Email and status required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate status
        const validStatuses = ['paid', 'pending', 'free'];
        if (!validStatuses.includes(status)) {
            return new Response(JSON.stringify({ error: 'Invalid status. Use: paid, pending, free' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(process.env.DATABASE_URL);

        // Ensure has_paid column exists (not in original schema)
        try {
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT false`;
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP`;
        } catch (_) { /* columns likely exist */ }

        let result;
        try {
            if (status === 'paid') {
                result = await sql`
                    UPDATE users 
                    SET payment_status = ${status},
                        has_paid = true,
                        paid_at = COALESCE(paid_at, NOW())
                    WHERE LOWER(email) = LOWER(${email})
                    RETURNING email, payment_status, has_paid
                `;
            } else {
                result = await sql`
                    UPDATE users 
                    SET payment_status = ${status},
                        has_paid = false
                    WHERE LOWER(email) = LOWER(${email})
                    RETURNING email, payment_status, has_paid
                `;
            }
        } catch (sqlErr) {
            // Fallback: update without has_paid in case column still doesn't exist
            console.error('SQL update with has_paid failed, trying fallback:', sqlErr.message);
            if (status === 'paid') {
                result = await sql`
                    UPDATE users 
                    SET payment_status = ${status},
                        paid_at = COALESCE(paid_at, NOW())
                    WHERE LOWER(email) = LOWER(${email})
                    RETURNING email, payment_status
                `;
            } else {
                result = await sql`
                    UPDATE users 
                    SET payment_status = ${status}
                    WHERE LOWER(email) = LOWER(${email})
                    RETURNING email, payment_status
                `;
            }
        }

        if (result.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Status updated to ${status}`,
            user: result[0]
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error updating member status:', error);
        return new Response(JSON.stringify({ 
            error: 'Server error: ' + error.message,
            stack: error.stack?.substring(0, 300),
            name: error.name 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
