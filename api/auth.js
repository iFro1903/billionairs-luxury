// Authentication API for BILLIONAIRS
// Handles user registration, login, and session management
// NOW WITH REAL DATABASE INTEGRATION

import { createHash, randomBytes } from 'crypto';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../lib/rate-limiter.js';
import { hashPassword, verifyPassword } from '../lib/password-hash.js';
import { getPool } from '../lib/db.js';
import { getCorsOrigin } from '../lib/cors.js';
import { generateMemberId } from '../lib/helpers.js';
import { logRequest, logSuccess, logWarn, logError, logTimer } from '../lib/logger.js';

// Check if hash needs upgrade from SHA-256 to PBKDF2
function needsHashUpgrade(storedHash) {
    return storedHash && !storedHash.startsWith('pbkdf2$');
}

// Helper function to get base URL
function getBaseUrl(req) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || req.headers['x-forwarded-host'];
    return `${protocol}://${host}`;
}

// Helper function to generate session token (cryptographically secure)
function generateToken() {
    return randomBytes(32).toString('hex');
}

// HttpOnly Cookie helpers
function getTokenFromCookie(req) {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/billionairs_session=([^;]+)/);
    return match ? match[1] : null;
}

function setAuthCookie(res, token, maxAge = 86400) {
    res.setHeader('Set-Cookie',
        `billionairs_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`
    );
}

function clearAuthCookie(res) {
    res.setHeader('Set-Cookie',
        `billionairs_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
    );
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action, email, password, token: bodyToken, firstName, lastName } = req.body;
    const timer = logTimer('auth_handler');
    logRequest('auth', req.method, { action, email: email ? email.replace(/(.{2}).*@/, '$1***@') : undefined });
    
    // Read token from HttpOnly cookie (primary) or body (fallback for migration)
    const token = getTokenFromCookie(req) || bodyToken;
    
    // Apply rate limiting for auth actions
    if (action === 'register' || action === 'login') {
        const clientIp = getClientIp(req);
        const rateLimit = await checkRateLimit(clientIp, RATE_LIMITS.AUTH.maxRequests, RATE_LIMITS.AUTH.windowMs, RATE_LIMITS.AUTH.endpoint);
        
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', RATE_LIMITS.AUTH.maxRequests);
        res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
        res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());
        
        if (!rateLimit.allowed) {
            res.setHeader('Retry-After', rateLimit.retryAfter);
            return res.status(429).json({ 
                success: false, 
                message: RATE_LIMITS.AUTH.message,
                retryAfter: rateLimit.retryAfter
            });
        }
    }
    
    const pool = getPool();

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
            const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
            
            if (existingUser.rows.length > 0) {
                
                return res.status(400).json({ success: false, message: 'User already exists' });
            }

            // Validate password strength
            if (password.length < 8) {
                
                return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
            }

            // Create new user with full name
            const hashedPassword = await hashPassword(password);
            const memberId = generateMemberId();
            const fullName = `${firstName || ''} ${lastName || ''}`.trim();
            
            await pool.query(
                'INSERT INTO users (email, password_hash, member_id, payment_status, full_name) VALUES ($1, $2, $3, $4, $5)',
                [email, hashedPassword, memberId, 'pending', fullName || null]
            );

            
            // Send Welcome Email with credentials
            try {
                const userName = `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0];
                await fetch(`${getBaseUrl(req)}/api/email-service`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'welcome',
                        to: email,
                        userName: userName,
                        userEmail: email,
                        userPassword: password  // Send plain password for initial email
                    })
                });
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
                
                return res.status(400).json({ success: false, message: 'Email and password required' });
            }

            // Get user from database
            const userResult = await pool.query(
                'SELECT id, email, password_hash, member_id, payment_status, full_name FROM users WHERE email = $1',
                [email]
            );
            
            if (userResult.rows.length === 0) {
                
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const user = userResult.rows[0];
            const isValidPassword = await verifyPassword(password, user.password_hash);
            
            if (!isValidPassword) {
                
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            // Auto-upgrade legacy SHA-256 hash to PBKDF2 on successful login
            if (needsHashUpgrade(user.password_hash)) {
                try {
                    const upgradedHash = await hashPassword(password);
                    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [upgradedHash, user.id]);
                } catch (upgradeErr) {
                    console.warn('⚠️ Hash upgrade failed (non-critical):', upgradeErr.message);
                }
            }

            // Update last login
            await pool.query('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

            // Create session
            const sessionToken = generateToken();
            const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
            
            await pool.query(
                'INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)',
                [sessionToken, user.id, expiresAt]
            );

            
            // Set HttpOnly cookie with session token
            setAuthCookie(res, sessionToken);

            return res.status(200).json({
                success: true,
                user: {
                    email: user.email,
                    memberId: user.member_id,
                    paymentStatus: user.payment_status,
                    fullName: user.full_name || ''
                }
            });
        }

        // VERIFY SESSION
        if (action === 'verify') {
            if (!token) {
                clearAuthCookie(res);
                return res.status(401).json({ success: false, message: 'No token provided' });
            }

            // Get session from database
            // Get session from database
            const sessionResult = await pool.query(
                'SELECT s.expires_at, u.id, u.email, u.member_id, u.payment_status, u.full_name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1',
                [token]
            );
            if (sessionResult.rows.length === 0) {
                
                return res.status(401).json({ success: false, message: 'Invalid session' });
            }

            const session = sessionResult.rows[0];

            // Check if session expired
            if (new Date() > new Date(session.expires_at)) {
                await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
                clearAuthCookie(res);
                return res.status(401).json({ success: false, message: 'Session expired' });
            }

            
            return res.status(200).json({
                success: true,
                user: {
                    email: session.email,
                    memberId: session.member_id,
                    paymentStatus: session.payment_status,
                    fullName: session.full_name || ''
                }
            });
        }

        // LOGOUT
        if (action === 'logout') {
            if (token) {
                await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
            }
            clearAuthCookie(res);
            return res.status(200).json({ success: true, message: 'Logged out successfully' });
        }

        // UPDATE PAYMENT STATUS (called after successful payment)
        if (action === 'update_payment') {
            if (!token) {
                
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            // Get user from session
            const sessionResult = await pool.query(
                'SELECT u.id, u.email, u.member_id FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1',
                [token]
            );
            
            if (sessionResult.rows.length === 0) {
                
                return res.status(401).json({ success: false, message: 'Invalid session' });
            }

            const user = sessionResult.rows[0];

            // Update payment status
            await pool.query(
                'UPDATE users SET payment_status = $1, paid_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['paid', user.id]
            );

            
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
        logError('auth', error, { action: req.body?.action });
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: 'Internal server error'
        });
    } finally {
        timer.end({ action: req.body?.action });
        try { await pool.end(); } catch (e) {}
    }
}
