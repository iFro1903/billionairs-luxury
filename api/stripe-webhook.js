// Stripe Webhook Handler - Automatically updates payment status
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

export const config = {
    runtime: 'edge'
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured');
        return new Response('Webhook secret not configured', { status: 500 });
    }

    let event;

    try {
        // Verify webhook signature
        const body = await req.text();
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error('⚠️ Webhook signature verification failed:', err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the event
    const sql = neon(process.env.DATABASE_URL);

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
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
                            SET payment_status = 'paid',
                                stripe_session_id = ${session.id},
                                payment_date = NOW()
                            WHERE email = ${email}
                            RETURNING id, email, member_id
                        `;

                        if (result.length > 0) {
                            const user = result[0];
                            console.log(`✅ Payment updated for: ${user.email} (${user.member_id})`);
                        } else {
                            console.error(`⚠️ User not found: ${email}`);
                        }
                    }
                }
                break;
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                console.log('✅ PaymentIntent succeeded:', paymentIntent.id);
                
                const email = paymentIntent.metadata?.email;
                if (email) {
                    await sql`
                        UPDATE users 
                        SET payment_status = 'paid',
                            stripe_payment_id = ${paymentIntent.id},
                            payment_date = NOW()
                        WHERE email = ${email}
                    `;
                }
                break;
            }

            case 'charge.refunded': {
                const charge = event.data.object;
                console.log('💸 Charge refunded:', charge.id);
                
                await sql`
                    UPDATE payments
                    SET refund_status = 'completed',
                        refunded_at = NOW()
                    WHERE stripe_charge_id = ${charge.id}
                `;
                break;
            }

            case 'charge.dispute.created': {
                const dispute = event.data.object;
                console.log('⚠️ Dispute created:', dispute.id);
                
                await sql`
                    INSERT INTO audit_logs (action, user_email, ip, details, timestamp)
                    VALUES (
                        'PAYMENT_DISPUTE',
                        'system',
                        'stripe_webhook',
                        ${JSON.stringify({
                            dispute_id: dispute.id,
                            charge_id: dispute.charge,
                            amount: dispute.amount,
                            reason: dispute.reason
                        })},
                        NOW()
                    )
                `;
                break;
            }

            case 'payment_intent.payment_failed': {
                const failedPayment = event.data.object;
                console.error('❌ Payment failed:', failedPayment.id);
                
                const email = failedPayment.metadata?.email;
                if (email) {
                    await sql`
                        INSERT INTO audit_logs (action, user_email, ip, details, timestamp)
                        VALUES (
                            'PAYMENT_FAILED',
                            ${email},
                            'stripe_webhook',
                            ${JSON.stringify({
                                payment_intent_id: failedPayment.id,
                                error: failedPayment.last_payment_error?.message
                            })},
                            NOW()
                        )
                    `;
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Webhook handler error:', error);
        return new Response(JSON.stringify({ 
            error: 'Webhook handler failed', 
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
