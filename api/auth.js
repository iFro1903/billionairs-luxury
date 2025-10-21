// Authentication API for BILLIONAIRS
// Handles user registration, login, and session management

import { createHash } from 'crypto';

// Temporary in-memory storage (you'll want to use a real database later)
const users = new Map();
const sessions = new Map();

// Helper function to hash passwords
function hashPassword(password) {
    return createHash('sha256').update(password).digest('hex');
}

// Helper function to generate session token
function generateToken() {
    return createHash('sha256').update(Date.now() + Math.random().toString()).digest('hex');
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
            if (users.has(email)) {
                return res.status(400).json({ success: false, message: 'User already exists' });
            }

            // Validate password strength
            if (password.length < 8) {
                return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
            }

            // Create new user
            const hashedPassword = hashPassword(password);
            users.set(email, {
                email,
                password: hashedPassword,
                createdAt: new Date().toISOString(),
                paymentStatus: 'pending', // pending, paid
                memberId: `BILL-${Date.now()}`
            });

            console.log(`✅ New user registered: ${email}`);

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

            const user = users.get(email);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const hashedPassword = hashPassword(password);
            if (user.password !== hashedPassword) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            // Create session
            const sessionToken = generateToken();
            sessions.set(sessionToken, {
                email: user.email,
                createdAt: Date.now(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            });

            console.log(`✅ User logged in: ${email}`);

            return res.status(200).json({
                success: true,
                token: sessionToken,
                user: {
                    email: user.email,
                    memberId: user.memberId,
                    paymentStatus: user.paymentStatus
                }
            });
        }

        // VERIFY SESSION
        if (action === 'verify') {
            if (!token) {
                return res.status(401).json({ success: false, message: 'No token provided' });
            }

            const session = sessions.get(token);
            if (!session) {
                return res.status(401).json({ success: false, message: 'Invalid session' });
            }

            // Check if session expired
            if (Date.now() > session.expiresAt) {
                sessions.delete(token);
                return res.status(401).json({ success: false, message: 'Session expired' });
            }

            const user = users.get(session.email);
            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            return res.status(200).json({
                success: true,
                user: {
                    email: user.email,
                    memberId: user.memberId,
                    paymentStatus: user.paymentStatus
                }
            });
        }

        // LOGOUT
        if (action === 'logout') {
            if (token) {
                sessions.delete(token);
            }
            return res.status(200).json({ success: true, message: 'Logged out successfully' });
        }

        // UPDATE PAYMENT STATUS (called after successful payment)
        if (action === 'update_payment') {
            if (!token) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            const session = sessions.get(token);
            if (!session) {
                return res.status(401).json({ success: false, message: 'Invalid session' });
            }

            const user = users.get(session.email);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            user.paymentStatus = 'paid';
            user.paidAt = new Date().toISOString();

            console.log(`💰 Payment confirmed for: ${user.email}`);

            return res.status(200).json({
                success: true,
                message: 'Payment status updated',
                user: {
                    email: user.email,
                    memberId: user.memberId,
                    paymentStatus: user.paymentStatus
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
