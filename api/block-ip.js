// IP Blocking Management Endpoint (Admin only)
import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge'
};

const CEO_EMAIL = 'furkan_akaslan@hotmail.com';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { ip, reason, duration, adminEmail, action = 'block' } = await request.json();

    if (!ip) {
      return new Response(JSON.stringify({ error: 'IP address required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Erstelle blocked_ips Tabelle falls nicht existiert
    await sql`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id SERIAL PRIMARY KEY,
        ip VARCHAR(100) NOT NULL UNIQUE,
        reason TEXT,
        blocked_at TIMESTAMP DEFAULT NOW(),
        blocked_by VARCHAR(255),
        expires_at TIMESTAMP,
        auto_blocked BOOLEAN DEFAULT false
      )
    `;

    if (action === 'unblock') {
      // Unblock IP
      await sql`DELETE FROM blocked_ips WHERE ip = ${ip}`;
      
      // Audit Log
      await logAudit(sql, {
        action: 'IP_UNBLOCKED',
        user: adminEmail || 'system',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: JSON.stringify({ unblocked_ip: ip })
      });

      return new Response(JSON.stringify({ 
        success: true,
        message: 'IP unblocked'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Block IP
    const expiresAt = duration ? new Date(Date.now() + duration) : null;
    const autoBlocked = !adminEmail;

    await sql`
      INSERT INTO blocked_ips (ip, reason, blocked_by, expires_at, auto_blocked)
      VALUES (
        ${ip}, 
        ${reason || 'No reason provided'}, 
        ${adminEmail || 'system'}, 
        ${expiresAt ? expiresAt.toISOString() : null},
        ${autoBlocked}
      )
      ON CONFLICT (ip) 
      DO UPDATE SET
        reason = ${reason || 'No reason provided'},
        blocked_at = NOW(),
        blocked_by = ${adminEmail || 'system'},
        expires_at = ${expiresAt ? expiresAt.toISOString() : null},
        auto_blocked = ${autoBlocked}
    `;

    // Audit Log
    await logAudit(sql, {
      action: 'IP_BLOCKED',
      user: adminEmail || 'system',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      details: JSON.stringify({ 
        blocked_ip: ip, 
        reason, 
        duration,
        auto: autoBlocked 
      })
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'IP blocked successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('IP block error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
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
