/**
 * @fileoverview Shared Admin Session Verification
 * Checks admin identity via:
 *   1. billionairs_session HttpOnly cookie (preferred, secure)
 *   2. X-Admin-Password header (legacy fallback)
 *
 * Supports both Web API Request (Edge) and Node.js IncomingMessage (CJS).
 *
 * Usage in any admin API endpoint:
 *   import { verifyAdminSession } from '../lib/verify-admin.js';
 *   const auth = await verifyAdminSession(req);
 *   if (!auth.authorized) return auth.response;
 *   // auth.email is available
 */

import { neon } from '@neondatabase/serverless';

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

/**
 * Get a header value from either Web API Request or Node.js IncomingMessage.
 */
function getHeader(req, name) {
    if (typeof req.headers?.get === 'function') {
        return req.headers.get(name);
    }
    // Node.js IncomingMessage — headers object, keys are lowercase
    return req.headers?.[name.toLowerCase()] || null;
}

/**
 * Verify admin session from cookie or legacy header
 * @param {Request|import('http').IncomingMessage} req
 * @returns {Promise<{authorized: boolean, email?: string, response?: Response}>}
 */
export async function verifyAdminSession(req) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    // ── Method 1: HttpOnly session cookie (secure) ──
    const cookieHeader = getHeader(req, 'cookie') || '';
    const sessionMatch = cookieHeader.match(/billionairs_session=([^;]+)/);

    if (sessionMatch) {
        const sessionToken = sessionMatch[1];
        try {
            const result = await sql`
                SELECT s.user_id, u.email
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ${sessionToken}
                  AND s.expires_at > NOW()
                LIMIT 1
            `;

            if (result.length > 0 && result[0].email.toLowerCase() === CEO_EMAIL.toLowerCase()) {
                return { authorized: true, email: result[0].email };
            }
            // Cookie present but session invalid/expired or not CEO
            console.warn('Session cookie present but invalid:', {
                tokenPrefix: sessionToken.substring(0, 8) + '...',
                resultCount: result.length,
                email: result.length > 0 ? result[0].email : 'none'
            });
        } catch (err) {
            console.error('Session cookie verification error:', err);
        }
    }

    // ── Method 2: Legacy X-Admin-Password header (backward compat) ──
    const adminEmail = getHeader(req, 'x-admin-email');
    const adminPassword = getHeader(req, 'x-admin-password');

    if (adminEmail && adminPassword) {
        if (adminEmail.toLowerCase() !== CEO_EMAIL.toLowerCase()) {
            return {
                authorized: false,
                response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                })
            };
        }

        try {
            const { verifyPasswordSimple } = await import('./password-hash.js');
            const passwordHash = process.env.ADMIN_PASSWORD_HASH;
            if (passwordHash && (await verifyPasswordSimple(adminPassword, passwordHash))) {
                return { authorized: true, email: adminEmail };
            }
        } catch (err) {
            console.error('Legacy password verification error:', err);
        }

        return {
            authorized: false,
            response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        };
    }

    // ── No valid authentication found ──
    return {
        authorized: false,
        response: new Response(JSON.stringify({ 
            error: 'Unauthorized',
            debug: {
                hasCookie: !!sessionMatch,
                cookieCount: cookieHeader ? cookieHeader.split(';').length : 0,
                hasLegacyHeaders: !!(getHeader(req, 'x-admin-email'))
            }
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        })
    };
  } catch (fatalErr) {
    console.error('verifyAdminSession fatal error:', fatalErr);
    return {
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Authentication service error', details: fatalErr.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    };
  }
}

export { CEO_EMAIL };
