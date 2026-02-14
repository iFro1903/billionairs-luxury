// Admin Endpoint: Get Audit Logs
import { neon } from '@neondatabase/serverless';
import { verifyPasswordSimple as verifyPassword } from '../lib/password-hash.js';

export const config = {
  runtime: 'edge'
};

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

export default async function handler(request) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Authentifizierung prüfen
    const adminEmail = request.headers.get('x-admin-email');
    const adminPassword = request.headers.get('x-admin-password');

    if (adminEmail !== CEO_EMAIL) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!passwordHash || !(await verifyPassword(adminPassword, passwordHash))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
