// Vercel Serverless Function für SEPA Direct Debit
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerEmail, customerName } = req.body;

    // Validate input
    if (!customerEmail || !customerName) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    console.log('Creating SEPA Checkout Session for:', customerEmail);

    // Create Stripe Checkout Session with SEPA payment method
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['sepa_debit'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [{
        price_data: {
          currency: 'eur', // SEPA requires EUR
          product_data: {
            name: 'BILLIONAIRS Exclusive Access',
            description: 'Lifetime access to the exclusive BILLIONAIRS platform'
          },
          unit_amount: 50000000  // 500,000 EUR (in cents)
        },
        quantity: 1
      }],
      payment_intent_data: {
        setup_future_usage: 'off_session', // For SEPA mandate
        metadata: {
          customer_name: customerName,
          payment_method: 'sepa_debit'
        }
      },
      success_url: `${req.headers.origin || 'https://billionairs-luxury.vercel.app'}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://billionairs-luxury.vercel.app'}/payment-cancelled.html`
    });

    console.log('SEPA Session created:', session.id);
    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('SEPA Stripe error:', error);
    res.status(500).json({ 
      error: error.message,
      type: error.type || 'api_error'
    });
  }
};
