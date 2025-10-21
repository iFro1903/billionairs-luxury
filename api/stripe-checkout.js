// Vercel Serverless Function für Stripe Checkout
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'BILLIONAIRS Premium Zugang',
            description: 'Lebenslanger Zugang zur exklusiven BILLIONAIRS Plattform'
          },
          unit_amount: 9900
        },
        quantity: 1
      }],
      success_url: `${req.headers.origin || 'https://billionairs-luxury.vercel.app'}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://billionairs-luxury.vercel.app'}/payment-cancelled.html`
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
};
