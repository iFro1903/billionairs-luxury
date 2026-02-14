require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Stripe with the correct key based on environment
const stripeKey = isProduction 
    ? process.env.STRIPE_LIVE_SECRET_KEY 
    : process.env.STRIPE_TEST_SECRET_KEY || 'sk_test_REPLACE_WITH_YOUR_SECRET_KEY';

const stripe = require('stripe')(stripeKey);

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS configuration - restrictive in production
app.use((req, res, next) => {
    const allowedOrigins = isProduction 
        ? ['https://billionairs.luxury', 'https://www.billionairs.luxury']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Create Stripe Checkout Session - Optimized for Millionaires
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { priceId, mode, currency, amount, paymentType, metadata } = req.body;

        // Use lower amount for testing, full amount for production
        const testAmount = isProduction ? (amount || 50000000) : 50000000; // 500,000 CHF LIVE
        
        // Only use card for testing - it's the most reliable
        let paymentMethods = ['card'];
        
        // Bank transfers and Crypto - Unlimited (manual processing)
        // Note: SOFORT, iDEAL, Giropay have limits too low for 500K CHF
        // PayPal standard limit is 60K USD (can be increased for business accounts)
        // Cryptocurrency payments (BTC, ETH, USDT) handled separately with manual processing
        
        // For 500K CHF transactions, we support:
        // 1. Credit/Debit Cards (with bank authorization)
        // 2. Manual bank wire transfer (handled separately)
        // 3. Cryptocurrency (BTC/ETH/USDT - handled separately)
        
        const session = await stripe.checkout.sessions.create({
            mode: mode || 'payment',
            payment_method_types: paymentMethods,
            line_items: [{
                price_data: {
                    currency: currency || 'chf',
                    product_data: {
                        name: paymentType === 'split' ? 
                            'BILLIONAIRS - Exclusive Access (First Payment)' : 
                            'BILLIONAIRS - Exclusive Access',
                        description: paymentType === 'split' ?
                            '250,000 CHF - Initial payment for exclusive digital experience.' :
                            '500,000 CHF - Exclusive access to the BILLIONAIRS platform.',
                        images: ['https://billionairs.luxury/assets/images/og-image.png'],
                        metadata: {
                            tier: 'millionaire_segment',
                            payment_structure: paymentType
                        }
                    },
                    unit_amount: testAmount, // Use test amount
                },
                quantity: 1,
            }],
            metadata: {
                ...metadata,
                platform: 'BILLIONAIRS',
                product_type: 'exclusive_access',
                target_segment: 'millionaires_excess_liquidity',
                payment_tier: paymentType
            },
            success_url: `${process.env.DOMAIN || req.headers.origin}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.DOMAIN || req.headers.origin}/payment-cancelled.html`,
            
            // Custom branding for BILLIONAIRS
            ui_mode: 'hosted',
            
            // Millionaire-friendly settings (simplified for testing)
            billing_address_collection: 'auto',
            phone_number_collection: {
                enabled: false,
            },
            // Don't collect email - will be asked in the form
            allow_promotion_codes: false, // Millionaires don't need discounts
            automatic_tax: {
                enabled: false, // Disabled for testing
            },
            
            // Extended session for complex decisions (max 23.5 hours - Stripe limit)
            expires_at: Math.floor(Date.now() / 1000) + (23.5 * 60 * 60), // 23.5 hours
            
            // Custom payment page
            custom_text: {
                submit: {
                    message: paymentType === 'split' ? 
                        'Secure your exclusive access with the first payment. Second payment will be processed separately.' :
                        'Confirm your exclusive access to BILLIONAIRS - beyond wealth, beyond status.'
                }
            }
        });

        res.json({ id: session.id, url: session.url });

    } catch (error) {
        console.error('Stripe session creation error:', error);
        res.status(500).json({ 
            error: 'Failed to create checkout session',
            details: error.message 
        });
    }
});

// Webhook to handle successful payments
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET';

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.warn(`❌ Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            
            // TODO: In production:
            // 1. Grant access to the user
            // 2. Send confirmation email with access details
            // 3. Log transaction to database
            // 4. Update user status to "paid"
            // 5. Send notification to admin
            
            break;
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            break;
        case 'payment_intent.payment_failed':
            const failedIntent = event.data.object;
            break;
        default:
    }

    res.json({received: true});
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        environment: isProduction ? 'production' : 'development',
        timestamp: new Date().toISOString(),
        stripe: stripeKey ? 'configured' : 'missing',
        version: '2.0.0'
    });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
});