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
      
      try {
        // Check if user already exists
        const existingUser = await pool.query('SELECT id, payment_status FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
          // User exists - just update their info and continue to payment
          const userId = existingUser.rows[0].id;
          const currentStatus = existingUser.rows[0].payment_status;
          
          console.log(`✅ Existing user attempting payment: ${email} (current status: ${currentStatus})`);
          
          // Split fullName into first_name and last_name
          let firstName = '';
          let lastName = '';
          if (fullName) {
            const nameParts = fullName.trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          
          // Update user info including password (in case they changed anything)
          const hashedPassword = await hashPassword(password);
          await pool.query(
            'UPDATE users SET password_hash = $1, first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name), phone = COALESCE($4, phone), company = COALESCE($5, company) WHERE id = $6',
            [hashedPassword, firstName || null, lastName || null, phone || null, company || null, userId]
          );
          
          await pool.end();
          // Continue to payment checkout - don't block existing users from paying!
        } else {
          // Create new user with pending payment status
          const hashedPassword = await hashPassword(password);
          const memberId = generateMemberId();
          
          // Split fullName into first_name and last_name
          let firstName = '';
          let lastName = '';
          if (fullName) {
            const nameParts = fullName.trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          
          await pool.query(
            'INSERT INTO users (email, password_hash, member_id, payment_status, first_name, last_name, phone, company) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [email, hashedPassword, memberId, 'pending', firstName, lastName, phone || null, company || null]
          );

          await pool.end();
          console.log(`✅ New user account created via Stripe Checkout: ${email} (${memberId}) - ${firstName} ${lastName}`);
          
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
      metadata: {
        ...metadata,
        customer_email: customerData?.email || '',
        auto_login_email: customerData?.email || '' // For auto-login after payment
      },
      customer_email: customerData?.email || undefined,
      success_url: `https://billionairs-luxury.vercel.app/dashboard.html?session_id={CHECKOUT_SESSION_ID}&payment=success&email=${encodeURIComponent(customerData?.email || '')}&lang=${userLang}`,
      cancel_url: `https://billionairs-luxury.vercel.app/?message=Payment cancelled&lang=${userLang}`
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
};
