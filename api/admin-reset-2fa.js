import { neon } from '@neondatabase/serverless';
import { verifyAdminSession } from '../lib/verify-admin.js';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '../lib/rate-limiter.js';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Rate Limiting
    const ip = getClientIp(req);
    const { allowed, retryAfter } = await checkRateLimit(ip, RATE_LIMITS.TWO_FA_SETUP.maxRequests, RATE_LIMITS.TWO_FA_SETUP.windowMs, RATE_LIMITS.TWO_FA_SETUP.endpoint);
    if (!allowed) {
        return new Response(JSON.stringify({ error: RATE_LIMITS.TWO_FA_SETUP.message }), {
            status: 429,
            headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) }
        });
    }

    try {
        // Admin authentication (cookie + legacy header fallback)
        const auth = await verifyAdminSession(req);
        if (!auth.authorized) return auth.response;

        const { email } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        const sql = neon(dbUrl);

        // Check if 2FA exists for this user
        const existing = await sql`
            SELECT id, enabled FROM two_factor_auth WHERE user_email = ${email}
        `;

        if (existing.length === 0) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: '2FA ist nicht aktiviert fuer diesen User' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Delete 2FA entry completely (NOT NULL constraint on secret prevents UPDATE to NULL)
        await sql`
            DELETE FROM two_factor_auth 
            WHERE user_email = ${email}
        `;

        console.log(`[ADMIN] 2FA reset for user: ${email} by admin: ${adminEmail}`);

        return new Response(JSON.stringify({ 
            success: true, 
            message: `2FA fuer ${email} wurde zurueckgesetzt` 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin reset 2FA error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
