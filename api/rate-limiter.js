// Rate Limiting Middleware für Vercel Edge Functions
// Nutzt Upstash Redis für schnelles Distributed Rate Limiting

import { Redis } from '@upstash/redis';

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

    // Redis Connection (falls Upstash konfiguriert)
    let redis = null;
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }

    // Rate Limit Check mit Redis (wenn verfügbar) oder PostgreSQL Fallback
    let count = 0;
    
    if (redis) {
      // Redis Rate Limiting (schnell & distributed)
      const key = `rate:${ip}:${endpoint}`;
      count = await redis.incr(key);
      
      if (count === 1) {
        // Erste Request in diesem Window - setze Expiry
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }
    } else {
      // PostgreSQL Fallback (wenn Redis nicht konfiguriert)
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL);

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

      count = result[0].count;
    }

    if (count > maxRequests) {
      // Zu viele Requests - automatische IP-Blockierung nach mehrfachen Verstößen
      if (count > maxRequests * 3) {
        await fetch(`${getBaseUrl(request)}/api/block-ip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ip, 
            reason: `Automatic block: ${count} requests to ${endpoint}`,
            duration: 3600000 // 1 Stunde
          })
        });
      }

      return {
        allowed: false,
        error: 'Rate limit exceeded. Please try again later.',
        status: 429,
        retryAfter: Math.ceil(windowMs / 1000)
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - count,
      resetAt: Date.now() + windowMs
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
