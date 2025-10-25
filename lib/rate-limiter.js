// Rate Limiting System
// In-Memory Cache für Vercel Serverless
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.loginAttempts = new Map();
    
    // Cleanup alte Entries alle 5 Minuten
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  // Standard Rate Limit: 100 Requests/Minute
  async checkRateLimit(ip, limit = 100, windowMs = 60000) {
    const now = Date.now();
    const key = `${ip}`;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const userRequests = this.requests.get(key);
    
    // Entferne alte Requests außerhalb des Time Windows
    const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    
    if (validRequests.length >= limit) {
      const oldestRequest = Math.min(...validRequests);
      const resetTime = Math.ceil((oldestRequest + windowMs - now) / 1000);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        message: `Rate limit exceeded. Try again in ${resetTime} seconds.`
      };
    }
    
    // Füge neuen Request hinzu
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return {
      allowed: true,
      remaining: limit - validRequests.length,
      resetTime: Math.ceil(windowMs / 1000)
    };
  }

  // Spezial Rate Limit für Admin Login: 5 Versuche/15 Minuten
  async checkLoginLimit(ip) {
    const now = Date.now();
    const key = `login_${ip}`;
    const limit = 5;
    const windowMs = 15 * 60 * 1000; // 15 Minuten
    
    if (!this.loginAttempts.has(key)) {
      this.loginAttempts.set(key, []);
    }
    
    const attempts = this.loginAttempts.get(key);
    const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (validAttempts.length >= limit) {
      const oldestAttempt = Math.min(...validAttempts);
      const resetTime = Math.ceil((oldestAttempt + windowMs - now) / 1000);
      const resetMinutes = Math.ceil(resetTime / 60);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        message: `Too many login attempts. Try again in ${resetMinutes} minutes.`
      };
    }
    
    // Füge neuen Login-Versuch hinzu
    validAttempts.push(now);
    this.loginAttempts.set(key, validAttempts);
    
    return {
      allowed: true,
      remaining: limit - validAttempts.length,
      resetTime: Math.ceil(windowMs / 1000)
    };
  }

  // Erfolgreiches Login -> Reset der Login-Attempts
  resetLoginAttempts(ip) {
    const key = `login_${ip}`;
    this.loginAttempts.delete(key);
  }

  // Cleanup alte Entries
  cleanup() {
    const now = Date.now();
    const maxAge = 15 * 60 * 1000; // 15 Minuten
    
    // Cleanup requests
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < maxAge);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
    
    // Cleanup login attempts
    for (const [key, timestamps] of this.loginAttempts.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < maxAge);
      if (validTimestamps.length === 0) {
        this.loginAttempts.delete(key);
      } else {
        this.loginAttempts.set(key, validTimestamps);
      }
    }
  }
}

// Singleton Instance
const rateLimiter = new RateLimiter();

// Helper: IP Adresse aus Request extrahieren
export function getClientIP(request) {
  // Vercel spezifische Headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Middleware für Rate Limiting
export async function withRateLimit(request, handler, options = {}) {
  const ip = getClientIP(request);
  const { limit = 100, windowMs = 60000 } = options;
  
  const result = await rateLimiter.checkRateLimit(ip, limit, windowMs);
  
  if (!result.allowed) {
    return new Response(JSON.stringify({ 
      error: result.message,
      retryAfter: result.resetTime 
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': result.resetTime.toString(),
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetTime.toString()
      }
    });
  }
  
  const response = await handler();
  
  // Füge Rate Limit Headers zur Response hinzu
  if (response.headers) {
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
  }
  
  return response;
}

// Login-spezifisches Rate Limiting
export async function withLoginRateLimit(request, handler) {
  const ip = getClientIP(request);
  const result = await rateLimiter.checkLoginLimit(ip);
  
  if (!result.allowed) {
    return new Response(JSON.stringify({ 
      error: result.message,
      retryAfter: result.resetTime 
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': result.resetTime.toString()
      }
    });
  }
  
  return handler();
}

// Reset Login Attempts nach erfolgreichem Login
export function resetLoginAttempts(request) {
  const ip = getClientIP(request);
  rateLimiter.resetLoginAttempts(ip);
}

export default rateLimiter;
