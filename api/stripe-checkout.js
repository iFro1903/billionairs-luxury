// Vercel Serverless Function für Stripe Checkout
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pg = require('pg');
const crypto = require('crypto');

const { Pool } = pg;

// Helper function to hash passwords
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper function to generate member ID
function generateMemberId() {
    return `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Create connection pool
function getPool() {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_URL;
    return new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerData, metadata } = req.body;

    // If customer data is provided, create account before checkout
    if (customerData && customerData.email && customerData.password) {
      const { email, password, fullName, phone, company } = customerData;
      
      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Email and password are required'
        });
      }

      // Validate password length
      if (password.length < 8) {
        return res.status(400).json({ 
          error: 'Invalid password',
          message: 'Password must be at least 8 characters'
        });
      }

      // Create user account in database
      const pool = getPool();
      
      try {
        // Check if user already exists
        const existingUser = await pool.query('SELECT id, payment_status FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
          // User exists - just update their info and continue to payment
          const userId = existingUser.rows[0].id;
          const currentStatus = existingUser.rows[0].payment_status;
          
          console.log(`✅ Existing user attempting payment: ${email} (current status: ${currentStatus})`);
          
          // Update user info (in case they changed phone, name, etc.)
          await pool.query(
            'UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), company = COALESCE($3, company) WHERE id = $4',
            [fullName || null, phone || null, company || null, userId]
          );
          
          await pool.end();
          // Continue to payment checkout - don't block existing users from paying!
        } else {
          // Create new user with pending payment status
          const hashedPassword = hashPassword(password);
          const memberId = generateMemberId();
          
          await pool.query(
            'INSERT INTO users (email, password_hash, member_id, payment_status, full_name, phone, company) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [email, hashedPassword, memberId, 'pending', fullName || null, phone || null, company || null]
          );

          await pool.end();
          console.log(`✅ New user account created via Stripe Checkout: ${email} (${memberId})`);
        }

      } catch (dbError) {
        console.error('Database error:', dbError);
        await pool.end();
        // Continue anyway - account creation failure shouldn't block payment
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'chf',
          product_data: {
            name: 'BILLIONAIRS Exclusive Access',
            description: 'Lifetime access to the exclusive BILLIONAIRS platform'
          },
          unit_amount: 50000000  // 500,000 CHF (in cents)
        },
        quantity: 1
      }],
      metadata: metadata || {},
      customer_email: customerData?.email || undefined,
      success_url: `${req.headers.origin || 'https://billionairs-luxury.vercel.app'}/login.html?message=Payment successful! Your account has been created. Please login.`,
      cancel_url: `${req.headers.origin || 'https://billionairs-luxury.vercel.app'}/?message=Payment cancelled`
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
};
