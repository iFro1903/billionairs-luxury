/**
 * Database-backed Rate Limiter for Vercel Serverless Functions
 * Uses PostgreSQL (Neon) for persistent rate limiting across instances
 * Works in both Edge and Node.js runtimes
 */

import { neon } from '@neondatabase/serverless';

// Table creation flag - only try once per cold start
let tableCreated = false;

async function ensureTable(sql) {
    if (tableCreated) return;
    try {
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
        tableCreated = true;
    } catch (e) {
        // Table likely already exists
        tableCreated = true;
    }
}

/**
 * Rate limiter using PostgreSQL for persistent storage
 * @param {string} ip - Client IP address
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<Object>} - { allowed, remaining, resetAt, retryAfter }
 */
export async function checkRateLimit(ip, maxRequests, windowMs) {
    try {
        const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_URL;
        if (!dbUrl) {
            // No DB configured - fail open
            console.warn('Rate limiter: No database URL configured');
            return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs, retryAfter: 0 };
        }

        const sql = neon(dbUrl);
        await ensureTable(sql);

        const windowStartTime = new Date(Date.now() - windowMs);

        // Atomic upsert: insert or increment count, reset if window expired
        const result = await sql`
            INSERT INTO rate_limits (ip, endpoint, count, window_start, last_request)
            VALUES (${ip}, ${'auth'}, 1, NOW(), NOW())
            ON CONFLICT (ip, endpoint) 
            DO UPDATE SET
                count = CASE 
                    WHEN rate_limits.window_start < ${windowStartTime.toISOString()}::timestamp
                    THEN 1
                    ELSE rate_limits.count + 1
                END,
                window_start = CASE 
                    WHEN rate_limits.window_start < ${windowStartTime.toISOString()}::timestamp
                    THEN NOW()
                    ELSE rate_limits.window_start
                END,
                last_request = NOW()
            RETURNING count, window_start
        `;

        const count = result[0].count;
        const windowStart = new Date(result[0].window_start);
        const resetAt = windowStart.getTime() + windowMs;

        if (count > maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetAt,
                retryAfter: Math.ceil((resetAt - Date.now()) / 1000)
            };
        }

        return {
            allowed: true,
            remaining: maxRequests - count,
            resetAt,
            retryAfter: 0
        };

    } catch (error) {
        console.error('Rate limiter error:', error);
        // Fail open - allow request if rate limiter fails
        return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs, retryAfter: 0 };
    }
}

/**
 * Get client IP from request headers
 * Supports both Edge (req.headers.get) and Node.js (req.headers[]) formats
 * @param {Request|Object} req - Request object
 * @returns {string} - Client IP address
 */
export function getClientIp(req) {
    // Edge Runtime format
    if (typeof req.headers?.get === 'function') {
        return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('x-real-ip') ||
               'unknown';
    }
    
    // Node.js format
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.headers?.['x-real-ip'] || 'unknown';
}

/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
    // Login/Register: 10 attempts per 15 minutes
    AUTH: {
        maxRequests: 10,
        windowMs: 15 * 60 * 1000,
        message: 'Too many authentication attempts. Please try again in 15 minutes.'
    },
    
    // Password Reset: 3 attempts per hour
    PASSWORD_RESET: {
        maxRequests: 3,
        windowMs: 60 * 60 * 1000,
        message: 'Too many password reset requests. Please try again in 1 hour.'
    },
    
    // General API: 60 requests per minute
    API: {
        maxRequests: 60,
        windowMs: 60 * 1000,
        message: 'Too many requests. Please slow down.'
    }
};
