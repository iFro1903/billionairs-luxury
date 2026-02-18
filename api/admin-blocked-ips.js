// Admin Endpoint: Get Blocked IPs
import { neon } from '@neondatabase/serverless';
import { verifyAdminSession } from '../lib/verify-admin.js';

export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Admin authentication (cookie + legacy header fallback)
    const auth = await verifyAdminSession(request);
    if (!auth.authorized) return auth.response;

    const sql = neon(process.env.DATABASE_URL);

    // Hole alle blockierten IPs
    const blockedIps = await sql`
      SELECT 
        id,
        ip,
        reason,
        blocked_at,
        blocked_by,
        expires_at,
        auto_blocked,
        CASE 
          WHEN expires_at IS NULL THEN true
          WHEN expires_at > NOW() THEN true
          ELSE false
        END as is_active
      FROM blocked_ips
      ORDER BY blocked_at DESC
    `;

    // Statistiken
    const stats = {
      total: blockedIps.length,
      active: blockedIps.filter(ip => ip.is_active).length,
      expired: blockedIps.filter(ip => !ip.is_active).length,
      autoBlocked: blockedIps.filter(ip => ip.auto_blocked).length
    };

    return new Response(JSON.stringify({ 
      success: true,
      blockedIps,
      stats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get blocked IPs error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
