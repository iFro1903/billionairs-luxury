// Manual Payment Status Update API
import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Method not allowed' 
        }), { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { email, status } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Email required' 
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(process.env.DATABASE_URL);

        // Update payment status
        const result = await sql`
            UPDATE users 
            SET payment_status = ${status || 'paid'},
                payment_date = NOW()
            WHERE email = ${email}
            RETURNING id, email, member_id, payment_status, payment_date
        `;

        if (result.length === 0) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'User not found' 
            }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const user = result[0];

        console.log(`✅ Payment status updated for: ${user.email} to ${user.payment_status}`);

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Payment status updated',
            user: {
                email: user.email,
                memberId: user.member_id,
                paymentStatus: user.payment_status,
                paymentDate: user.payment_date
            }
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Error updating payment status:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            message: error.message 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
