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

        const hasPaid = status === 'paid';

        let result;
        if (status === 'paid') {
            // Set to paid: keep existing paid_at or set to now
            result = await sql`
                UPDATE users 
                SET payment_status = ${status},
                    has_paid = true,
                    paid_at = COALESCE(paid_at, NOW())
                WHERE email = ${email}
                RETURNING email, payment_status, has_paid
            `;
        } else {
            // Set to free/pending: clear paid status
            result = await sql`
                UPDATE users 
                SET payment_status = ${status},
                    has_paid = false
                WHERE email = ${email}
                RETURNING email, payment_status, has_paid
            `;
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
        return new Response(JSON.stringify({ error: 'Server error: ' + error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
