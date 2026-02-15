// Vercel Serverless Function für Stripe Checkout
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const { getPool } = await import('../lib/db.js');
  const { hashPassword } = await import('../lib/password-hash.js');
  const { generateMemberId } = await import('../lib/helpers.js');
  const { logRequest, logSuccess, logError, logTimer } = await import('../lib/logger.js');
  const timer = logTimer('stripe_checkout');
  logRequest('stripe-checkout', req.method, { email: req.body?.customerData?.email ? req.body.customerData.email.replace(/(.{2}).*@/, '$1***@') : undefined });

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Rate limiting: 5 checkout attempts per 15 minutes
    const { checkRateLimit, getClientIp, RATE_LIMITS } = await import('../lib/rate-limiter.js');
    const clientIp = getClientIp(req);
    const rl = await checkRateLimit(clientIp, RATE_LIMITS.STRIPE_CHECKOUT.maxRequests, RATE_LIMITS.STRIPE_CHECKOUT.windowMs, RATE_LIMITS.STRIPE_CHECKOUT.endpoint);
    if (!rl.allowed) {
      return res.status(429).json({
        success: false,
        error: RATE_LIMITS.STRIPE_CHECKOUT.message,
        retryAfter: rl.retryAfter
      });
    }

    const { customerData, metadata, language } = req.body;
    const userLang = language || 'en'; // Get language from request

    // If customer data is provided, create account before checkout
    if (customerData && customerData.email && customerData.password) {
      const { email, password, fullName, phone, company } = customerData;
      
      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ 
          success: false,
          error: 'Email and password are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email address'
        });
      }

      // Validate password length
      if (password.length < 8) {
        return res.status(400).json({ 
          success: false,
          error: 'Password must be at least 8 characters'
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
          // User exists — do NOT overwrite password (prevents account takeover)
          const userId = existingUser.rows[0].id;
          const currentStatus = existingUser.rows[0].payment_status;
          
          // Only update non-sensitive profile fields, never the password
          await client.query(
            'UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), company = COALESCE($3, company) WHERE id = $4',
            [fullName || null, phone || null, company || null, userId]
          );
          
        } else {
          // Create new user with pending payment status
          const hashedPassword = await hashPassword(password);
          const memberId = generateMemberId();
          
          const insertResult = await client.query(
            'INSERT INTO users (email, password_hash, member_id, payment_status, full_name, phone, company) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [email, hashedPassword, memberId, 'pending', fullName || null, phone || null, company || null]
          );

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
                userEmail: email
              })
            });
            
            if (emailResponse.ok) {
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
          success: false,
          error: 'Failed to create user account. Please try again or contact support.'
        });
      } finally {
        if (client) {
          try {
            client.release();
          } catch (releaseError) {
            console.error('Error releasing client in finally:', releaseError);
          }
        }
        await pool.end();
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
      success_url: `https://billionairs.luxury/payment-success.html?session_id={CHECKOUT_SESSION_ID}&lang=${userLang}`,
      cancel_url: `https://billionairs.luxury/payment-cancelled.html?lang=${userLang}`
    });

    logSuccess('stripe-checkout', 'checkout_session_created', { sessionId: session.id });
    timer.end();
    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    logError('stripe-checkout', error);
    timer.end();
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
