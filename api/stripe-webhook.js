// Stripe Webhook Handler - Automatically updates payment status
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
import { captureError, captureMessage } from '../lib/sentry.js';

export const config = {
    runtime: 'edge'
};

// Helper function to send payment confirmation email
async function sendPaymentConfirmationEmail(email, userName, amount, currency, productName) {
    try {
        const emailApiUrl = 'https://billionairs-luxury.vercel.app/api/email-service';
        
        console.log(`📧 Attempting to send payment email to: ${email}`);
        console.log(`📧 Email API URL: ${emailApiUrl}`);
        console.log(`📧 Payment details: ${amount} ${currency}`);

        const emailPayload = {
            to: email,
            type: 'payment',
            data: {
                userName: userName || email.split('@')[0],
                amount: amount,
                currency: currency,
                productName: productName || 'BILLIONAIRS Access'
            }
        };
        
        console.log(`📧 Email payload:`, JSON.stringify(emailPayload));

        const response = await fetch(emailApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailPayload)
        });

        console.log(`📧 Email API response status: ${response.status}`);
        
        const result = await response.json();
        console.log(`📧 Email API response:`, JSON.stringify(result));
        
        if (result.success) {
            console.log(`✅ Payment confirmation email sent successfully to: ${email}`);
        } else {
            console.error(`❌ Failed to send payment email to ${email}:`, result.error);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Error sending payment confirmation email:', error);
        console.error('Error details:', error.message, error.stack);
        return { success: false, error: error.message };
    }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        const error = new Error('STRIPE_WEBHOOK_SECRET not configured');
        console.error(error.message);
        captureError(error, {
            tags: { category: 'config', endpoint: 'stripe-webhook' }
        });
        return new Response('Webhook secret not configured', { status: 500 });
    }

    let event;

    try {
        // Verify webhook signature (use async method for Edge Runtime)
        const body = await req.text();
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
        console.error('⚠️ Webhook signature verification failed:', err.message);
        captureError(err, {
            tags: { 
                category: 'webhook',
                endpoint: 'stripe-webhook',
                error_type: 'signature_verification'
            }
        });
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
                console.log('Mode:', session.mode);
                
                // Handle payment - check multiple conditions for maximum reliability
                const isPaid = session.payment_status === 'paid' || session.mode === 'payment';
                
                if (isPaid) {
                    const email = session.customer_details?.email;
                    
                    if (!email) {
                        console.error('⚠️ No email found in session:', session.id);
                        captureMessage('Checkout session completed without email', {
                            level: 'warning',
                            tags: { session_id: session.id }
                        });
                        break;
                    }
                    
                    try {
                        // CRITICAL: Update user payment status with UPSERT logic
                        const result = await sql`
                            UPDATE users 
                            SET payment_status = 'paid',
                                stripe_session_id = ${session.id},
                                payment_date = COALESCE(payment_date, NOW())
                            WHERE email = ${email}
                            RETURNING id, email, member_id, name, full_name
                        `;

                        if (result.length > 0) {
                            const user = result[0];
                            console.log(`✅ PAYMENT CONFIRMED for: ${user.email} (${user.member_id})`);
                            console.log(`✅ User ID: ${user.id}, Payment Date: ${new Date().toISOString()}`);
                            
                            // Send payment confirmation email
                            const amount = (session.amount_total / 100).toFixed(2);
                            const currency = session.currency?.toUpperCase() || 'EUR';
                            const userName = user.full_name || user.name || user.email.split('@')[0];
                            
                            await sendPaymentConfirmationEmail(
                                user.email,
                                userName,
                                amount,
                                currency,
                                'BILLIONAIRS Exclusive Access'
                            );
                            
                            captureMessage('Payment successfully processed', {
                                level: 'info',
                                tags: { 
                                    user_id: user.id,
                                    member_id: user.member_id,
                                    session_id: session.id
                                }
                            });
                        } else {
                            console.error(`❌ CRITICAL: User not found for email: ${email}`);
                            console.error(`Session ID: ${session.id}`);
                            
                            captureError(new Error('User not found after payment'), {
                                tags: { 
                                    category: 'payment',
                                    email: email,
                                    session_id: session.id
                                }
                            });
                        }
                    } catch (dbError) {
                        console.error('❌ CRITICAL: Database error updating payment:', dbError);
                        captureError(dbError, {
                            tags: { 
                                category: 'database',
                                endpoint: 'stripe-webhook',
                                email: email,
                                session_id: session.id
                            }
                        });
                        throw dbError; // Re-throw to trigger Stripe retry
                    }
                } else {
                    console.log(`⚠️ Session completed but payment_status is: ${session.payment_status}`);
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
        captureError(error, {
            tags: { 
                category: 'payment',
                endpoint: 'stripe-webhook',
                event_type: event?.type || 'unknown'
            },
            extra: {
                event_id: event?.id,
                stripe_account: event?.account
            }
        });
        return new Response(JSON.stringify({ 
            error: 'Webhook handler failed', 
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
