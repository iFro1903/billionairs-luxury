// Vercel Serverless Function for Auto-Login after Payment
// Uses proper DB session tokens (compatible with auth.js) + Stripe API verification
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

module.exports = async (req, res) => {
    const { getPool } = await import('../lib/db.js');
    const { getCorsOrigin } = await import('../lib/cors.js');

    // Generate cryptographically secure session token (same method as auth.js)
    function generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // HttpOnly Cookie helper
    function setAuthCookie(res, token, maxAge = 86400) {
        res.setHeader('Set-Cookie',
            `billionairs_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`
        );
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const pool = getPool();
    let client;

    try {
        const { email, sessionId } = req.body;

        if (!email || !sessionId) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing email or sessionId' 
            });
        }

        // SECURITY: Verify the Stripe checkout session via Stripe API
        let stripeSession;
        try {
            stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
                expand: ['payment_intent']
            });
        } catch (stripeError) {
            console.error('Stripe session verification failed:', stripeError.message);
            return res.status(400).json({
                success: false,
                error: 'Invalid Stripe session'
            });
        }

        // Verify payment was actually successful
        const isPaid = stripeSession.payment_status === 'paid' || 
                       stripeSession.payment_intent?.status === 'succeeded';

        if (!isPaid) {
            return res.status(403).json({
                success: false,
                error: 'Payment not confirmed by Stripe'
            });
        }

        // Verify the email matches the Stripe session
        const stripeEmail = stripeSession.customer_details?.email || 
                            stripeSession.metadata?.customer_email;
        
        if (stripeEmail && stripeEmail.toLowerCase() !== email.toLowerCase()) {
            return res.status(403).json({
                success: false,
                error: 'Email does not match payment session'
            });
        }

        client = await pool.connect();

        // Find user by email
        const userResult = await client.query(
            'SELECT id, email, member_id, full_name, payment_status, email_verified, login_streak, pyramid_unlocked, eye_unlocked, chat_ready FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }

        const user = userResult.rows[0];

        // Mark user as paid (verified through Stripe API above)
        if (user.payment_status !== 'paid') {
            await client.query(
                'UPDATE users SET payment_status = $1, has_paid = $2, payment_method = $3 WHERE id = $4',
                ['paid', true, 'stripe', user.id]
            );
            user.payment_status = 'paid';
        }

        // Create proper DB session token (compatible with auth.js verify)
        const sessionToken = generateToken();
        const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours

        await client.query(
            'INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)',
            [sessionToken, user.id, expiresAt]
        );

        // Update last login
        await client.query(
            'UPDATE users SET last_seen = NOW() WHERE id = $1',
            [user.id]
        );

        // Set HttpOnly cookie with DB session token (24 hours)
        setAuthCookie(res, sessionToken, 24 * 60 * 60);

        // Return success WITHOUT token in body (token is in HttpOnly cookie)
        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                memberId: user.member_id,
                fullName: user.full_name,
                paymentStatus: user.payment_status,
                emailVerified: user.email_verified,
                loginStreak: user.login_streak,
                pyramidUnlocked: user.pyramid_unlocked,
                eyeUnlocked: user.eye_unlocked,
                chatReady: user.chat_ready
            }
        });

    } catch (error) {
        console.error('Auto-login error:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Internal server error'
        });
    } finally {
        if (client) client.release();
        await pool.end();
    }
};
