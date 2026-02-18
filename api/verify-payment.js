// Vercel Serverless Function to verify Stripe payment and update user status
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const { getPool } = await import('../lib/db.js');
  const { getCorsOrigin } = await import('../lib/cors.js');
  const { checkRateLimit, getClientIp, RATE_LIMITS } = await import('../lib/rate-limiter.js');

  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Rate limiting: 10 requests per 15 minutes per IP
  const clientIp = getClientIp(req);
  const rateLimit = await checkRateLimit(clientIp, 10, 900000, 'verify-payment');
  if (!rateLimit.allowed) {
    return res.status(429).json({ success: false, error: 'Too many requests. Try again later.' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ 
        success: false,
        error: 'sessionId is required'
      });
    }

    // Retrieve the session from Stripe with expanded payment_intent
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    // Get email from Stripe session metadata (not from client request)
    const email = session.customer_email || session.metadata?.customer_email || session.metadata?.auto_login_email;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'No email associated with this payment session'
      });
    }

    // Check if payment was successful (check both session and payment_intent)
    const isPaid = session.payment_status === 'paid' || 
                   session.payment_intent?.status === 'succeeded';

    if (isPaid) {
      const pool = getPool();
      
      try {
        // Update user's payment status with payment_date and stripe info
        const updateResult = await pool.query(
          `UPDATE users 
           SET payment_status = $1, 
               has_paid = true,
               payment_date = CURRENT_TIMESTAMP,
               stripe_session_id = $3
           WHERE email = $2 
           RETURNING id, member_id, email, payment_status`,
          ['paid', email, sessionId]
        );

        if (updateResult.rows.length === 0) {
          await pool.end();
          return res.status(404).json({ 
            success: false,
            error: 'No user found with this email'
          });
        }

        const user = updateResult.rows[0];

        // Create payment record
        await pool.query(
          'INSERT INTO payments (user_id, stripe_payment_id, amount, currency, status) VALUES ($1, $2, $3, $4, $5)',
          [user.id, session.payment_intent || session.id, session.amount_total, session.currency, 'completed']
        );

        await pool.end();

        return res.status(200).json({ 
          success: true,
          paymentStatus: 'paid',
          user: {
            email: user.email,
            memberId: user.member_id,
            paymentStatus: user.payment_status
          },
          message: 'Payment verified successfully'
        });

      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        await pool.end();
        return res.status(500).json({ 
          success: false,
          error: 'Internal server error'
        });
      }

    } else {
      
      return res.status(200).json({ 
        success: false,
        paymentStatus: session.payment_status,
        error: 'Payment not yet completed'
      });
    }

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error'
    });
  }
};
