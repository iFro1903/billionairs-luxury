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

    // Rate Limiting - Destruktive Admin-Aktion
    const ip = getClientIp(req);
    const { allowed, retryAfter } = await checkRateLimit(ip, RATE_LIMITS.ADMIN_DESTRUCTIVE.maxRequests, RATE_LIMITS.ADMIN_DESTRUCTIVE.windowMs, RATE_LIMITS.ADMIN_DESTRUCTIVE.endpoint);
    if (!allowed) {
        return new Response(JSON.stringify({ error: RATE_LIMITS.ADMIN_DESTRUCTIVE.message }), {
            status: 429,
            headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) }
        });
    }

    try {
        // Admin authentication (cookie + legacy body fallback)
        const auth = await verifyAdminSession(req);
        if (!auth.authorized) return auth.response;

        const { mode } = await req.json();

        const sql = neon(process.env.DATABASE_URL);

        // Create emergency_mode table if it doesn't exist
        await sql`
            CREATE TABLE IF NOT EXISTS emergency_mode (
                id INTEGER PRIMARY KEY DEFAULT 1,
                is_active BOOLEAN DEFAULT false,
                activated_at TIMESTAMP,
                activated_by TEXT,
                reason TEXT
            )
        `;

        // Check if row exists
        const existing = await sql`SELECT * FROM emergency_mode WHERE id = 1`;
        
        if (existing.length === 0) {
            // Create initial row
            await sql`INSERT INTO emergency_mode (id, is_active) VALUES (1, false)`;
        }

        // Update mode
        if (mode === 'activate') {
            await sql`
                UPDATE emergency_mode 
                SET is_active = true,
                    activated_at = NOW(),
                    activated_by = ${email},
                    reason = 'CEO manual activation'
                WHERE id = 1
            `;
        } else if (mode === 'deactivate') {
            await sql`
                UPDATE emergency_mode 
                SET is_active = false,
                    activated_at = NULL,
                    activated_by = NULL,
                    reason = NULL
                WHERE id = 1
            `;
        }

        return new Response(JSON.stringify({ success: true, mode }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Emergency mode error:', error);
        return new Response(JSON.stringify({ error: 'Failed to update emergency mode' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
