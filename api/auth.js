// Authentication API for BILLIONAIRS
// Handles user registration, login, and session management
// NOW WITH REAL DATABASE INTEGRATION

import pg from 'pg';
import { createHash } from 'crypto';

const { Pool } = pg;

// Helper function to get base URL
function getBaseUrl(req) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || req.headers['x-forwarded-host'];
    return `${protocol}://${host}`;
}

// Helper function to hash passwords
function hashPassword(password) {
    return createHash('sha256').update(password).digest('hex');
}

// Helper function to generate session token
function generateToken() {
    return createHash('sha256').update(Date.now() + Math.random().toString()).digest('hex');
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

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action, email, password, token, firstName, lastName } = req.body;
    const pool = getPool();

    try {
        // REGISTER
        if (action === 'register') {
            if (!email || !password) {
                await pool.end();
                return res.status(400).json({ success: false, message: 'Email and password required' });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                await pool.end();
                return res.status(400).json({ success: false, message: 'Invalid email format' });
            }

            // Check if user already exists
            const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            
            if (existingUser.rows.length > 0) {
                await pool.end();
                return res.status(400).json({ success: false, message: 'User already exists' });
            }

            // Validate password strength
            if (password.length < 8) {
                await pool.end();
                return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
            }

            // Create new user with first and last name
            const hashedPassword = hashPassword(password);
            const memberId = generateMemberId();
            
            await pool.query(
                'INSERT INTO users (email, password_hash, member_id, payment_status, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6)',
                [email, hashedPassword, memberId, 'pending', firstName || '', lastName || '']
            );

            await pool.end();
            console.log(`✅ New user registered: ${email} (${memberId}) - ${firstName} ${lastName}`);

            // Send Welcome Email
            try {
                const userName = `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0];
                await fetch(`${getBaseUrl(req)}/api/email-service`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'welcome',
                        to: email,
                        userName: userName
                    })
                });
                console.log(`📧 Welcome email sent to ${email}`);
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
                // Don't fail registration if email fails
            }

            return res.status(200).json({
                success: true,
                message: 'Registration successful. Please login.'
            });
        }

        // LOGIN
        if (action === 'login') {
            if (!email || !password) {
                await pool.end();
                return res.status(400).json({ success: false, message: 'Email and password required' });
            }

            // Get user from database
            const userResult = await pool.query(
                'SELECT id, email, password_hash, member_id, payment_status, first_name, last_name FROM users WHERE email = $1',
                [email]
            );
            
            if (userResult.rows.length === 0) {
                await pool.end();
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const user = userResult.rows[0];
            const hashedPassword = hashPassword(password);
            
            if (user.password_hash !== hashedPassword) {
                await pool.end();
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            // Update last login
            await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

            // Create session
            const sessionToken = generateToken();
            const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
            
            await pool.query(
                'INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)',
                [sessionToken, user.id, expiresAt]
            );

            await pool.end();
            console.log(`✅ User logged in: ${email}`);

            return res.status(200).json({
                success: true,
                token: sessionToken,
                user: {
                    email: user.email,
                    memberId: user.member_id,
                    paymentStatus: user.payment_status,
                    firstName: user.first_name || '',
                    lastName: user.last_name || ''
                }
            });
        }

        // VERIFY SESSION
        if (action === 'verify') {
            if (!token) {
                await pool.end();
                return res.status(401).json({ success: false, message: 'No token provided' });
            }

            // Get session from database
            const sessionResult = await pool.query(
                'SELECT s.expires_at, u.id, u.email, u.member_id, u.payment_status, u.first_name, u.last_name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1',
                [token]
            );
            
            if (sessionResult.rows.length === 0) {
                await pool.end();
                return res.status(401).json({ success: false, message: 'Invalid session' });
            }

            const session = sessionResult.rows[0];

            // Check if session expired
            if (new Date() > new Date(session.expires_at)) {
                await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
                await pool.end();
                return res.status(401).json({ success: false, message: 'Session expired' });
            }

            await pool.end();
            return res.status(200).json({
                success: true,
                user: {
                    email: session.email,
                    memberId: session.member_id,
                    paymentStatus: session.payment_status,
                    firstName: session.first_name || '',
                    lastName: session.last_name || ''
                }
            });
        }

        // LOGOUT
        if (action === 'logout') {
            if (token) {
                await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
            }
            await pool.end();
            return res.status(200).json({ success: true, message: 'Logged out successfully' });
        }

        // UPDATE PAYMENT STATUS (called after successful payment)
        if (action === 'update_payment') {
            if (!token) {
                await pool.end();
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            // Get user from session
            const sessionResult = await pool.query(
                'SELECT u.id, u.email, u.member_id FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1',
                [token]
            );
            
            if (sessionResult.rows.length === 0) {
                await pool.end();
                return res.status(401).json({ success: false, message: 'Invalid session' });
            }

            const user = sessionResult.rows[0];

            // Update payment status
            await pool.query(
                'UPDATE users SET payment_status = $1, paid_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['paid', user.id]
            );

            await pool.end();
            console.log(`💰 Payment confirmed for: ${user.email}`);

            return res.status(200).json({
                success: true,
                message: 'Payment status updated',
                user: {
                    email: user.email,
                    memberId: user.member_id,
                    paymentStatus: 'paid'
                }
            });
        }

        await pool.end();
        return res.status(400).json({ success: false, message: 'Invalid action' });

    } catch (error) {
        console.error('Authentication Error:', error);
        try {
            await pool.end();
        } catch (e) {}
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}
