// IP Block Check Endpoint
import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { ip } = await request.json();

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

    // Prüfe ob IP geblockt ist
    const result = await sql`
      SELECT * FROM blocked_ips 
      WHERE ip = ${ip}
      AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `;

    const blocked = result.length > 0;

    return new Response(JSON.stringify({ 
      blocked,
      blockInfo: blocked ? result[0] : null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('IP block check error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      blocked: false // Fail-open bei Fehler
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
