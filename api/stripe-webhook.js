// Stripe Webhook Handler - Automatically updates payment status
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sql } = require('@vercel/postgres');

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Verify webhook signature
        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            // For testing without webhook secret
            event = req.body;
        }
    } catch (err) {
        console.error('⚠️ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                
                console.log('✅ Checkout session completed:', session.id);
                console.log('Customer email:', session.customer_details?.email);
                console.log('Payment status:', session.payment_status);
                
                if (session.payment_status === 'paid') {
                    const email = session.customer_details?.email;
                    
                    if (email) {
                        // Update user payment status to 'paid'
                        const result = await sql`
                            UPDATE users 
                            SET payment_status = 'paid'
                            WHERE email = ${email}
                            RETURNING id, email, member_id
                        `;

                        if (result.rows.length > 0) {
                            const user = result.rows[0];
                            console.log(`✅ Payment status updated to 'paid' for user: ${user.email} (${user.member_id})`);
                            
                            // Insert payment record
                            await sql`
                                INSERT INTO payments (user_id, amount, currency, payment_method, status, stripe_session_id)
                                VALUES (${user.id}, ${session.amount_total}, ${session.currency}, 'stripe', 'completed', ${session.id})
                            `;
                            
                            console.log(`✅ Payment record created for user ${user.email}`);
                        } else {
                            console.error(`⚠️ User not found with email: ${email}`);
                        }
                    }
                }
                break;

            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log('✅ PaymentIntent succeeded:', paymentIntent.id);
                break;

            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                console.error('❌ Payment failed:', failedPayment.id);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error('❌ Webhook handler error:', error);
        res.status(500).json({ error: 'Webhook handler failed', details: error.message });
    }
}

// Important: Disable body parsing for Stripe webhooks
export const config = {
    api: {
        bodyParser: false,
    },
};
