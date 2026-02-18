/**
 * Delete all users except CEO
 * Admin API endpoint
 */

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

        const sql = neon(process.env.DATABASE_URL);

        // Delete all users except CEO
        const ceoEmail = 'furkan_akaslan@hotmail.com';
        
        // Get count before deletion
        const beforeCount = await sql`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE email != ${ceoEmail}
        `;
        
        // Delete users
        const result = await sql`
            DELETE FROM users 
            WHERE email != ${ceoEmail}
            RETURNING email
        `;
        
        // Log the action
        await sql`
            INSERT INTO audit_logs (action, user_email, details, ip_address, timestamp)
            VALUES (
                'bulk_user_deletion',
                ${adminEmail},
                ${JSON.stringify({ 
                    deleted_count: result.length,
                    kept_user: ceoEmail 
                })},
                ${req.headers.get('x-forwarded-for') || 'unknown'},
                NOW()
            )
        `;

        return new Response(JSON.stringify({ 
            success: true,
            deleted_count: result.length,
            deleted_users: result.map(u => u.email),
            message: `Successfully deleted ${result.length} users. CEO account preserved.`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Delete users error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to delete users'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
