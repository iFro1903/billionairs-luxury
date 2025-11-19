// Vercel Serverless Function for Auto-Login after Payment
const pg = require('pg');
const jwt = require('jsonwebtoken');

const { Pool } = pg;

// Create connection pool
function getPool() {
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_URL;
    return new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
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

        client = await pool.connect();

        // Find user by email
        const userResult = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }

        const user = userResult.rows[0];

        // If user comes from Stripe checkout (has sessionId), mark as paid
        // Stripe only redirects to success_url if payment was successful
        if (sessionId && user.payment_status !== 'paid') {
            console.log(`✅ Auto-updating payment status to 'paid' for ${email} after successful Stripe checkout`);
            
            await client.query(
                'UPDATE users SET payment_status = $1, has_paid = $2, payment_method = $3 WHERE id = $4',
                ['paid', true, 'stripe', user.id]
            );
            
            // Update user object for token generation
            user.payment_status = 'paid';
            user.has_paid = true;
        }

        // Check if user has paid
        if (user.payment_status !== 'paid') {
            return res.status(403).json({ 
                success: false,
                error: 'Payment not confirmed yet. Please wait a moment.' 
            });
        }

        // Generate JWT token for authentication
        const jwtSecret = process.env.JWT_SECRET || 'billionairs-luxury-secret-key-change-in-production';
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                memberId: user.member_id
            },
            jwtSecret,
            { expiresIn: '30d' }
        );

        // Update last login
        await client.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        // Return success with token and user data
        return res.status(200).json({
            success: true,
            token: token,
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
            error: 'Internal server error',
            message: error.message 
        });
    } finally {
        if (client) client.release();
    }
};
