// Rate Limiting Middleware für Vercel Edge Functions
// Speichert Rate Limit Counter in Neon PostgreSQL

export default async function rateLimiter(request, endpoint, maxRequests = 10, windowMs = 60000) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Prüfe ob IP geblockt ist
    const blockCheck = await fetch(`${getBaseUrl(request)}/api/check-ip-block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    
    const blockData = await blockCheck.json();
    if (blockData.blocked) {
      return {
        allowed: false,
        error: 'IP address blocked',
        status: 403
      };
    }

    // Rate Limit Check mit Neon Database
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);

    // Erstelle rate_limits Tabelle falls nicht existiert
    await sql`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id SERIAL PRIMARY KEY,
        ip VARCHAR(100) NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        count INTEGER DEFAULT 1,
        window_start TIMESTAMP DEFAULT NOW(),
        last_request TIMESTAMP DEFAULT NOW(),
        UNIQUE(ip, endpoint)
      )
    `;

    const windowStartTime = new Date(Date.now() - windowMs);

    // Hole oder erstelle Rate Limit Entry
    const result = await sql`
      INSERT INTO rate_limits (ip, endpoint, count, window_start, last_request)
      VALUES (${ip}, ${endpoint}, 1, NOW(), NOW())
      ON CONFLICT (ip, endpoint) 
      DO UPDATE SET
        count = CASE 
          WHEN rate_limits.window_start < ${windowStartTime.toISOString()}
          THEN 1
          ELSE rate_limits.count + 1
        END,
        window_start = CASE 
          WHEN rate_limits.window_start < ${windowStartTime.toISOString()}
          THEN NOW()
          ELSE rate_limits.window_start
        END,
        last_request = NOW()
      RETURNING *
    `;

    const record = result[0];

    if (record.count > maxRequests) {
      // Zu viele Requests - automatische IP-Blockierung nach mehrfachen Verstößen
      if (record.count > maxRequests * 3) {
        await fetch(`${getBaseUrl(request)}/api/block-ip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ip, 
            reason: `Automatic block: ${record.count} requests to ${endpoint}`,
            duration: 3600000 // 1 Stunde
          })
        });
      }

      return {
        allowed: false,
        error: 'Rate limit exceeded. Please try again later.',
        status: 429,
        retryAfter: Math.ceil((new Date(record.window_start).getTime() + windowMs - Date.now()) / 1000)
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - record.count,
      resetAt: new Date(new Date(record.window_start).getTime() + windowMs)
    };

  } catch (error) {
    console.error('Rate limiter error:', error);
    // Bei Fehler erlauben (fail-open), aber loggen
    return {
      allowed: true,
      error: 'Rate limiter temporarily unavailable'
    };
  }
}

function getBaseUrl(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export { rateLimiter };
