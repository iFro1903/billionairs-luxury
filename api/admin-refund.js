// Payment Refund API
// Handles Stripe and PayPal refunds from Admin Panel

import { neon } from '@neondatabase/serverless';
import Stripe from 'stripe';

export const config = {
    runtime: 'edge'
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { paymentId, reason, adminEmail } = await req.json();

        if (!paymentId) {
            return new Response(JSON.stringify({ error: 'Payment ID required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify admin authentication
        if (adminEmail !== 'furkan_akaslan@hotmail.com') {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(process.env.DATABASE_URL);

        // Create refunds table if not exists
        await sql`
            CREATE TABLE IF NOT EXISTS refunds (
                id SERIAL PRIMARY KEY,
                payment_id VARCHAR(255) NOT NULL,
                user_email VARCHAR(255) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                refund_id VARCHAR(255),
                status VARCHAR(50) NOT NULL,
                reason TEXT,
                admin_email VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                completed_at TIMESTAMP,
                error_message TEXT
            )
        `;

        // Get payment details from users table
        const paymentResult = await sql`
            SELECT 
                email,
                payment_method,
                stripe_payment_intent_id,
                paypal_order_id,
                crypto_charge_id,
                wire_transfer_reference
            FROM users 
            WHERE id = ${paymentId} OR stripe_payment_intent_id = ${paymentId}
            LIMIT 1
        `;

        if (paymentResult.length === 0) {
            return new Response(JSON.stringify({ error: 'Payment not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const payment = paymentResult[0];
        const paymentMethod = payment.payment_method?.toLowerCase() || 'unknown';

        let refundResult;
        let refundId;

        // Process refund based on payment method
        if (paymentMethod === 'stripe' || paymentMethod === 'credit_card') {
            // Stripe Refund
            if (!payment.stripe_payment_intent_id) {
                return new Response(JSON.stringify({ error: 'No Stripe payment intent found' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                const refund = await stripe.refunds.create({
                    payment_intent: payment.stripe_payment_intent_id,
                    reason: reason || 'requested_by_customer',
                    metadata: {
                        admin_email: adminEmail,
                        refund_reason: reason || 'Admin refund'
                    }
                });

                refundId = refund.id;
                refundResult = {
                    success: true,
                    refundId: refund.id,
                    amount: refund.amount / 100, // Convert from cents
                    currency: refund.currency.toUpperCase(),
                    status: refund.status
                };
            } catch (error) {
                console.error('Stripe refund error:', error);
                
                // Log failed refund attempt
                await sql`
                    INSERT INTO refunds (
                        payment_id, user_email, amount, currency, payment_method,
                        status, reason, admin_email, error_message
                    ) VALUES (
                        ${paymentId}, ${payment.email}, 0, 'CHF', ${paymentMethod},
                        'failed', ${reason || 'Admin refund'}, ${adminEmail}, ${error.message}
                    )
                `;

                return new Response(JSON.stringify({ 
                    error: 'Refund failed',
                    message: error.message 
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

        } else if (paymentMethod === 'paypal') {
            // PayPal Refund
            if (!payment.paypal_order_id) {
                return new Response(JSON.stringify({ error: 'No PayPal order found' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Note: PayPal refunds require PayPal SDK or API
            // This is a placeholder - you need to implement PayPal refund API
            return new Response(JSON.stringify({ 
                error: 'PayPal refunds must be processed manually through PayPal dashboard',
                paypalOrderId: payment.paypal_order_id
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });

        } else if (paymentMethod === 'crypto' || paymentMethod === 'coinbase') {
            // Crypto refunds are manual
            return new Response(JSON.stringify({ 
                error: 'Crypto refunds must be processed manually',
                message: 'Please contact user to arrange manual crypto refund',
                chargeId: payment.crypto_charge_id
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });

        } else if (paymentMethod === 'wire_transfer' || paymentMethod === 'bank_transfer') {
            // Wire transfer refunds are manual
            return new Response(JSON.stringify({ 
                error: 'Wire transfer refunds must be processed manually',
                message: 'Please initiate bank transfer refund manually',
                reference: payment.wire_transfer_reference
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });

        } else {
            return new Response(JSON.stringify({ 
                error: 'Unknown payment method',
                method: paymentMethod
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Log successful refund
        await sql`
            INSERT INTO refunds (
                payment_id, user_email, amount, currency, payment_method,
                refund_id, status, reason, admin_email, completed_at
            ) VALUES (
                ${paymentId}, 
                ${payment.email}, 
                ${refundResult.amount}, 
                ${refundResult.currency}, 
                ${paymentMethod},
                ${refundId}, 
                'completed', 
                ${reason || 'Admin refund'}, 
                ${adminEmail},
                NOW()
            )
        `;

        // Update user payment status
        await sql`
            UPDATE users 
            SET payment_status = 'refunded'
            WHERE email = ${payment.email}
        `;

        // Audit log
        await sql`
            INSERT INTO audit_logs (action, user_email, ip, details)
            VALUES (
                'PAYMENT_REFUNDED',
                ${adminEmail},
                ${req.headers.get('x-forwarded-for') || 'unknown'},
                ${JSON.stringify({
                    refund_id: refundId,
                    user_email: payment.email,
                    amount: refundResult.amount,
                    currency: refundResult.currency,
                    reason: reason
                })}
            )
        `;

        // Send refund confirmation email
        try {
            await fetch(`${getBaseUrl(req)}/api/email-service`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'refund',
                    to: payment.email,
                    userName: payment.email.split('@')[0],
                    amount: refundResult.amount,
                    currency: refundResult.currency,
                    refundId: refundId
                })
            });
            console.log(`📧 Refund email sent to ${payment.email}`);
        } catch (emailError) {
            console.error('Failed to send refund email:', emailError);
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Refund processed successfully',
            refund: refundResult
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Refund processing error:', error);
        return new Response(JSON.stringify({ 
            error: 'Refund processing failed',
            message: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function getBaseUrl(req) {
    const url = new URL(req.url);
    return `${url.protocol}//${url.host}`;
}
