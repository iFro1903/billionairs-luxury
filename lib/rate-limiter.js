/**
 * Simple In-Memory Rate Limiter for Vercel Edge Functions
 * Tracks request counts per IP address with automatic cleanup
 */

// Store rate limit data in memory
// Format: { ip: { count: number, resetAt: timestamp } }
const rateLimitStore = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (data.resetAt < now) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter middleware
 * @param {string} ip - Client IP address
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} - { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(ip, maxRequests, windowMs) {
  const now = Date.now();
  const data = rateLimitStore.get(ip);

  // First request or window expired
  if (!data || data.resetAt < now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(ip, { count: 1, resetAt });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
      retryAfter: 0
    };
  }

  // Within window - check limit
  if (data.count < maxRequests) {
    data.count++;
    
    return {
      allowed: true,
      remaining: maxRequests - data.count,
      resetAt: data.resetAt,
      retryAfter: 0
    };
  }

  // Limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetAt: data.resetAt,
    retryAfter: Math.ceil((data.resetAt - now) / 1000) // seconds
  };
}

/**
 * Get client IP from request headers
 * @param {Request} req - Vercel request object
 * @returns {string} - Client IP address
 */
export function getClientIp(req) {
  // Try various headers that might contain the real IP
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a default (shouldn't happen on Vercel)
  return 'unknown';
}

/**
 * Preset rate limit configurations
 */
export const RATE_LIMITS = {
  // Login/Register: 50 attempts per 15 minutes (increased for testing)
  AUTH: {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  
  // Password Reset: 3 attempts per hour
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many password reset requests. Please try again in 1 hour.'
  },
  
  // General API: 100 requests per minute
  API: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please slow down.'
  }
};
