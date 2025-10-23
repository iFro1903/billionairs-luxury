// Vercel Serverless Function to verify Stripe payment and update user status
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pg = require('pg');

const { Pool } = pg;

function getPool() {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_URL;
    return new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });
}

module.exports = async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, email } = req.body;

    if (!sessionId || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'sessionId and email are required'
      });
    }

    console.log(`🔍 Verifying payment for session: ${sessionId}, email: ${email}`);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log(`📊 Session status: ${session.payment_status}, customer_email: ${session.customer_email}`);

    // Check if payment was successful
    if (session.payment_status === 'paid') {
      const pool = getPool();
      
      try {
        // Update user's payment status
        const updateResult = await pool.query(
          'UPDATE users SET payment_status = $1 WHERE email = $2 RETURNING id, member_id, email, payment_status',
          ['paid', email]
        );

        if (updateResult.rows.length === 0) {
          await pool.end();
          return res.status(404).json({ 
            error: 'User not found',
            message: 'No user found with this email'
          });
        }

        const user = updateResult.rows[0];

        // Create payment record
        await pool.query(
          'INSERT INTO payments (user_id, stripe_payment_id, amount, currency, status) VALUES ($1, $2, $3, $4, $5)',
          [user.id, session.payment_intent || session.id, session.amount_total, session.currency, 'completed']
        );

        await pool.end();

        console.log(`✅ Payment verified and status updated for: ${email}`);

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
          error: 'Database error',
          message: dbError.message
        });
      }

    } else {
      console.log(`⚠️ Payment not completed. Status: ${session.payment_status}`);
      
      return res.status(200).json({ 
        success: false,
        paymentStatus: session.payment_status,
        message: 'Payment not yet completed'
      });
    }

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    return res.status(500).json({ 
      error: 'Verification failed',
      message: error.message
    });
  }
};
