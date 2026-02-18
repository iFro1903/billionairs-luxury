/**
 * @fileoverview Shared Admin Session Verification
 * Checks admin identity via:
 *   1. billionairs_session HttpOnly cookie (preferred, secure)
 *   2. Authorization: Bearer <sessionToken> header (fallback when cookie blocked)
 *   3. X-Admin-Password header (legacy fallback)
 *
 * Supports both Web API Request (Edge) and Node.js IncomingMessage (CJS).
 */

import { neon } from '@neondatabase/serverless';

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

function getHeader(req, name) {
    if (typeof req.headers?.get === 'function') {
        return req.headers.get(name);
    }
    return req.headers?.[name.toLowerCase()] || null;
}

/**
 * Look up a session token in DB and verify it belongs to CEO
 */
async function verifySessionToken(sql, token) {
    if (!token) return null;
    try {
        const result = await sql`
            SELECT s.user_id, u.email
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ${token}
              AND s.expires_at > NOW()
            LIMIT 1
        `;
        if (result.length > 0 && result[0].email.toLowerCase() === CEO_EMAIL.toLowerCase()) {
            return result[0].email;
        }
    } catch (err) {
        console.error('Session token verification error:', err);
    }
    return null;
}

export async function verifyAdminSession(req) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    // ── Method 1: HttpOnly session cookie (preferred) ──
    const cookieHeader = getHeader(req, 'cookie') || '';
    const sessionMatch = cookieHeader.match(/billionairs_session=([^;]+)/);
    if (sessionMatch) {
        const email = await verifySessionToken(sql, sessionMatch[1]);
        if (email) return { authorized: true, email };
    }

    // ── Method 2: Authorization Bearer token (fallback for blocked cookies) ──
    const authHeader = getHeader(req, 'authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const email = await verifySessionToken(sql, token);
        if (email) return { authorized: true, email };
    }

    // ── Method 3: Legacy X-Admin-Password header ──
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
