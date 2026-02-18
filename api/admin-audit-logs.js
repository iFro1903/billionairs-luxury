// Admin Endpoint: Get Audit Logs
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

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const action = url.searchParams.get('action');

    const sql = neon(process.env.DATABASE_URL);

    // Erstelle audit_logs Tabelle falls nicht existiert
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

    // Hole Audit Logs mit optionalem Filter
    let logs;
    if (action) {
      logs = await sql`
        SELECT * FROM audit_logs
        WHERE action = ${action}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;
    } else {
      logs = await sql`
        SELECT * FROM audit_logs
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;
    }

    // Statistiken
    const stats = await sql`
      SELECT 
        action,
        COUNT(*) as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
    `;

    return new Response(JSON.stringify({ 
      success: true,
      logs,
      stats,
      total: logs.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
