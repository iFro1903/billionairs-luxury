// Authentication API for BILLIONAIRS
// Handles user registration, login, and session management
// NOW WITH REAL DATABASE INTEGRATION

import { sql } from '@vercel/postgres';
import { createHash } from 'crypto';

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

    const { action, email, password, token } = req.body;

    try {
        // REGISTER
        if (action === 'register') {
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password required' });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ success: false, message: 'Invalid email format' });
            }

            // Check if user already exists
            const existingUser = await sql`
                SELECT id FROM users WHERE email = ${email}
            `;
            
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'User already exists' });
            }

            // Validate password strength
            if (password.length < 8) {
                return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
            }

            // Create new user
            const hashedPassword = hashPassword(password);
            const memberId = generateMemberId();
            
            await sql`
                INSERT INTO users (email, password_hash, member_id, payment_status)
                VALUES (${email}, ${hashedPassword}, ${memberId}, 'pending')
            `;

            console.log(`✅ New user registered: ${email} (${memberId})`);

            return res.status(200).json({
                success: true,
                message: 'Registration successful. Please login.'
            });
        }

        // LOGIN
        if (action === 'login') {
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password required' });
            }

            // Get user from database
            const userResult = await sql`
                SELECT id, email, password_hash, member_id, payment_status 
                FROM users 
                WHERE email = ${email}
            `;
            
            if (userResult.rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const user = userResult.rows[0];
            const hashedPassword = hashPassword(password);
            
            if (user.password_hash !== hashedPassword) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            // Update last login
            await sql`
                UPDATE users 
                SET last_login = CURRENT_TIMESTAMP 
                WHERE id = ${user.id}
            `;

            // Create session
            const sessionToken = generateToken();
            const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
            
            await sql`
                INSERT INTO sessions (token, user_id, expires_at)
                VALUES (${sessionToken}, ${user.id}, ${expiresAt})
            `;

            console.log(`✅ User logged in: ${email}`);

            return res.status(200).json({
                success: true,
                token: sessionToken,
                user: {
                    email: user.email,
                    memberId: user.member_id,
                    paymentStatus: user.payment_status
                }
            });
        }

        // VERIFY SESSION
        if (action === 'verify') {
            if (!token) {
                return res.status(401).json({ success: false, message: 'No token provided' });
            }

            // Get session from database
            const sessionResult = await sql`
                SELECT s.expires_at, u.id, u.email, u.member_id, u.payment_status
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ${token}
            `;
            
            if (sessionResult.rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid session' });
            }

            const session = sessionResult.rows[0];

            // Check if session expired
            if (new Date() > new Date(session.expires_at)) {
                await sql`DELETE FROM sessions WHERE token = ${token}`;
                return res.status(401).json({ success: false, message: 'Session expired' });
            }

            return res.status(200).json({
                success: true,
                user: {
                    email: session.email,
                    memberId: session.member_id,
                    paymentStatus: session.payment_status
                }
            });
        }

        // LOGOUT
        if (action === 'logout') {
            if (token) {
                await sql`DELETE FROM sessions WHERE token = ${token}`;
            }
            return res.status(200).json({ success: true, message: 'Logged out successfully' });
        }

        // UPDATE PAYMENT STATUS (called after successful payment)
        if (action === 'update_payment') {
            if (!token) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            // Get user from session
            const sessionResult = await sql`
                SELECT u.id, u.email, u.member_id
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ${token}
            `;
            
            if (sessionResult.rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid session' });
            }

            const user = sessionResult.rows[0];

            // Update payment status
            await sql`
                UPDATE users 
                SET payment_status = 'paid', paid_at = CURRENT_TIMESTAMP 
                WHERE id = ${user.id}
            `;

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

        return res.status(400).json({ success: false, message: 'Invalid action' });

    } catch (error) {
        console.error('Authentication Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}
