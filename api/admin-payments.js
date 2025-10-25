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

        // Get all paid users (our payment records)
        const payments = await sql`
            SELECT 
                email,
                name,
                created_at,
                payment_method,
                payment_status
            FROM users
            WHERE has_paid = true
            ORDER BY created_at DESC
        `;

        // Calculate stats
        const totalRevenue = payments.length * 499999; // CHF 499,999 per user
        const stripeCount = payments.filter(p => 
            p.payment_method === 'stripe' || p.payment_method === 'card'
        ).length;
        const cryptoCount = payments.filter(p => 
            p.payment_method === 'crypto'
        ).length;
        const paypalCount = payments.filter(p => 
            p.payment_method === 'paypal'
        ).length;

        // Format payments for display
        const formattedPayments = payments.map(p => ({
            email: p.email,
            name: p.name || 'N/A',
            amount: 499999,
            method: p.payment_method || 'Unknown',
            status: p.payment_status || 'completed',
            created_at: p.created_at
        }));

        return new Response(JSON.stringify({
            payments: formattedPayments,
            totalRevenue,
            stripeCount,
            cryptoCount,
            paypalCount,
            totalPayments: payments.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin payments error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to load payments',
            payments: [],
            totalRevenue: 0,
            stripeCount: 0,
            cryptoCount: 0,
            paypalCount: 0,
            totalPayments: 0
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
