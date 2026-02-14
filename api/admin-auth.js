/**
 * @fileoverview Admin Authentication API Endpoint
 * @typedef {import('../types/api.js').AdminAuthRequest} AdminAuthRequest
 * @typedef {import('../types/api.js').AdminAuthResponse} AdminAuthResponse
 */

import { neon } from '@neondatabase/serverless';
import { rateLimiter } from './rate-limiter.js';
import { verifyPasswordSimple as verifyPassword } from '../lib/password-hash.js';
import { captureError, captureMessage } from '../lib/sentry.js';

export const config = {
    runtime: 'edge'
};

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

/**
 * Admin Authentication Handler
 * @param {Request} req - The incoming request
 * @returns {Promise<Response>} Authentication response
 */

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Rate Limiting: Max 5 Login-Versuche pro Minute
    const rateLimitResult = await rateLimiter(req, 'admin-login', 5, 60000);
    if (!rateLimitResult.allowed) {
        // Audit Log für Rate Limit
        const sql = neon(process.env.DATABASE_URL);
        await logAudit(sql, {
            action: 'LOGIN_RATE_LIMIT',
            user: 'unknown',
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            details: JSON.stringify({ endpoint: 'admin-auth' })
        });

        return new Response(JSON.stringify({ 
            error: rateLimitResult.error,
            retryAfter: rateLimitResult.retryAfter
        }), {
            status: rateLimitResult.status,
            headers: { 
                'Content-Type': 'application/json',
                'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
            }
        });
    }

    try {
        const { email, password, twoFactorCode } = await req.json();

        const sql = neon(process.env.DATABASE_URL);

        // CEO email check
        if (email.toLowerCase() !== CEO_EMAIL.toLowerCase()) {
            // Audit Log
            await logAudit(sql, {
                action: 'LOGIN_FAILED_INVALID_EMAIL',
                user: email,
                ip: req.headers.get('x-forwarded-for') || 'unknown',
                details: JSON.stringify({ reason: 'not_ceo_email' })
            });

            return new Response(JSON.stringify({ error: 'Access denied' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check password with Web Crypto API hash from environment variable
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!passwordHash) {
            const error = new Error('ADMIN_PASSWORD_HASH not set in environment variables');
            console.error(error.message);
            captureError(error, {
                tags: { category: 'config', endpoint: 'admin-auth' }
            });
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const isValidPassword = await verifyPassword(password, passwordHash);
        if (!isValidPassword) {
            // Audit Log
            await logAudit(sql, {
                action: 'LOGIN_FAILED_WRONG_PASSWORD',
                user: email,
                ip: req.headers.get('x-forwarded-for') || 'unknown',
                details: JSON.stringify({ reason: 'wrong_password' })
            });

            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if 2FA is enabled
        const twoFactorResult = await sql`
            SELECT enabled FROM two_factor_auth
            WHERE user_email = ${email}
            LIMIT 1
        `;

        const twoFactorEnabled = twoFactorResult.length > 0 && twoFactorResult[0].enabled;

        if (twoFactorEnabled) {
            if (!twoFactorCode) {
                // 2FA required but not provided
                return new Response(JSON.stringify({ 
                    requiresTwoFactor: true,
                    message: 'Two-factor authentication required'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Verify 2FA code
            const verifyResponse = await fetch(`${getBaseUrl(req)}/api/admin-2fa-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: twoFactorCode })
            });

            const verifyData = await verifyResponse.json();

            if (!verifyData.success) {
                return new Response(JSON.stringify({ 
                    error: 'Invalid 2FA code'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Audit Log für erfolgreichen Login
        await logAudit(sql, {
            action: 'LOGIN_SUCCESS',
            user: email,
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            details: JSON.stringify({ 
                twoFactor: twoFactorEnabled,
                timestamp: new Date().toISOString()
            })
        });

        // Create a server-side session so the CEO also has a valid billionairs_session cookie.
        // This enables authenticated access to protected APIs (e.g., chat CEO mode).
        let sessionCookie = '';
        try {
            // Find CEO user in users table
            const userResult = await sql`
                SELECT id FROM users WHERE LOWER(email) = ${email.toLowerCase()} LIMIT 1
            `;
            
            if (userResult.length > 0) {
                const userId = userResult[0].id;
                const sessionToken = crypto.randomUUID() + '-' + crypto.randomUUID();
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
                
                // Insert session
                await sql`
                    INSERT INTO sessions (user_id, token, expires_at)
                    VALUES (${userId}, ${sessionToken}, ${expiresAt.toISOString()})
                `;
                
                // Build Set-Cookie header
                const isProduction = req.url.includes('billionairs.luxury') || req.url.includes('vercel.app');
                sessionCookie = `billionairs_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${isProduction ? '; Secure' : ''}`;
            }
        } catch (sessionErr) {
            // Non-blocking — admin login still succeeds even if session creation fails
            console.error('Admin session creation error (non-blocking):', sessionErr);
        }

        // Password is correct, return success
        const responseHeaders = { 'Content-Type': 'application/json' };
        if (sessionCookie) {
            responseHeaders['Set-Cookie'] = sessionCookie;
        }

        return new Response(JSON.stringify({ 
            success: true,
            email: email.toLowerCase(),
            name: 'CEO',
            twoFactorEnabled
        }), {
            status: 200,
            headers: responseHeaders
        });

    } catch (error) {
        console.error('Admin auth error:', error);
        captureError(error, {
            tags: { 
                category: 'authentication',
                endpoint: 'admin-auth'
            },
            extra: {
                method: req.method,
                hasPassword: !!password,
                hasTwoFactorCode: !!twoFactorCode
            }
        });
        return new Response(JSON.stringify({ error: 'Authentication failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function getBaseUrl(request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
}

async function logAudit(sql, { action, user, ip, details }) {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                action VARCHAR(100) NOT NULL,
                user_email VARCHAR(255),
                ip VARCHAR(100),
                details TEXT,
                timestamp TIMESTAMP DEFAULT NOW()
            )
        `;

        await sql`
            INSERT INTO audit_logs (action, user_email, ip, details)
            VALUES (${action}, ${user}, ${ip}, ${details})
        `;
    } catch (error) {
        console.error('Audit log error:', error);
    }
}
