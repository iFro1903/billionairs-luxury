import { neon } from '@neondatabase/serverless';
import { rateLimiter } from './rate-limiter.js';

export const config = {
    runtime: 'edge'
};

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

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

        // Check password first (no database needed)
        const correctPassword = 'Masallah1,';
        if (password !== correctPassword) {
            // Audit Log
            await logAudit(sql, {
                action: 'LOGIN_FAILED_WRONG_PASSWORD',
                user: email,
                ip: req.headers.get('x-forwarded-for') || 'unknown',
    } catch (error) {
        console.error('Admin auth error:', error);
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

        // Password is correct, return success
        return new Response(JSON.stringify({ 
            email: email.toLowerCase(),
            name: 'CEO',
            twoFactorEnabled
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin auth error:', error);
        return new Response(JSON.stringify({ error: 'Authentication failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
