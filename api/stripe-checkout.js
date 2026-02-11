// Vercel Serverless Function für Stripe Checkout
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pg = require('pg');
const crypto = require('crypto');

const { Pool } = pg;

// Helper function to hash passwords (compatible with auth.js)
async function hashPassword(password) {
    const salt = crypto.randomUUID();
    const combined = salt + password;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    return `${salt}$${hash}`;
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
    const { customerData, metadata, language } = req.body;
    const userLang = language || 'en'; // Get language from request

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
      let client;
      
      try {
        client = await pool.connect();
        
        // Check if user already exists
        const existingUser = await client.query('SELECT id, payment_status FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
          // User exists - just update their info and continue to payment
          const userId = existingUser.rows[0].id;
          const currentStatus = existingUser.rows[0].payment_status;
          
          console.log(`✅ Existing user attempting payment: ${email} (current status: ${currentStatus})`);
          
          // Update user info including password (in case they changed anything)
          const hashedPassword = await hashPassword(password);
          await client.query(
            'UPDATE users SET password_hash = $1, full_name = COALESCE($2, full_name), phone = COALESCE($3, phone), company = COALESCE($4, company) WHERE id = $5',
            [hashedPassword, fullName || null, phone || null, company || null, userId]
          );
          
          console.log(`✅ Updated existing user: ${email}`);
        } else {
          // Create new user with pending payment status
          const hashedPassword = await hashPassword(password);
          const memberId = generateMemberId();
          
          const insertResult = await client.query(
            'INSERT INTO users (email, password_hash, member_id, payment_status, full_name, phone, company) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [email, hashedPassword, memberId, 'pending', fullName || null, phone || null, company || null]
          );

          console.log(`✅ New user account created via Stripe Checkout: ${email} (${memberId}) - ${fullName} - ID: ${insertResult.rows[0].id}`);
          
          // Send welcome email with credentials
          try {
            const userName = fullName || email.split('@')[0];
            const baseUrl = `https://${req.headers.host}`;
            
            const emailResponse = await fetch(`${baseUrl}/api/email-service`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'welcome',
                to: email,
                userName: userName,
                userEmail: email,
                userPassword: password
              })
            });
            
            if (emailResponse.ok) {
              console.log(`📧 Premium welcome email sent to ${email} with credentials`);
            } else {
              console.error(`❌ Email sending failed: ${emailResponse.status}`);
            }
          } catch (emailError) {
            console.error('❌ Email service error:', emailError.message);
            // Don't block registration if email fails
          }
        }

      } catch (dbError) {
        console.error('❌ Database error during user creation:', dbError);
        if (client) {
          try {
            client.release();
          } catch (releaseError) {
            console.error('Error releasing client:', releaseError);
          }
        }
        return res.status(500).json({ 
          error: 'Database error',
          message: 'Failed to create user account. Please try again or contact support.',
          details: dbError.message
        });
      } finally {
        if (client) {
          try {
            client.release();
          } catch (releaseError) {
            console.error('Error releasing client in finally:', releaseError);
          }
        }
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
            description: 'Access to the exclusive BILLIONAIRS platform'
          },
          unit_amount: 50000000  // 500,000 CHF LIVE
        },
        quantity: 1
      }],
      metadata: {
        ...metadata,
        customer_email: customerData?.email || '',
        auto_login_email: customerData?.email || '' // For auto-login after payment
      },
      customer_email: customerData?.email || undefined,
      success_url: `https://billionairs.luxury/payment-success.html?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(customerData?.email || '')}&lang=${userLang}`,
      cancel_url: `https://billionairs.luxury/?message=Payment cancelled&lang=${userLang}`
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
};
