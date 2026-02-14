/**
 * Structured Logging for BILLIONAIRS API
 * 
 * Provides consistent, JSON-structured logs for all API endpoints.
 * Works in both Edge Runtime and Node.js.
 * 
 * In production (Vercel), these logs appear in the Vercel dashboard
 * under Functions → Logs with full searchability.
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = process.env.LOG_LEVEL || (process.env.VERCEL_ENV === 'production' ? 'info' : 'debug');

/**
 * Create a structured log entry
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {string} message
 * @param {object} data - Additional structured data
 */
function log(level, message, data = {}) {
    if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LEVEL]) return;

    const entry = {
        level,
        msg: message,
        ts: new Date().toISOString(),
        env: process.env.VERCEL_ENV || 'dev',
        ...data,
    };

    // Vercel parses JSON logs automatically for structured querying
    const output = JSON.stringify(entry);

    switch (level) {
        case 'error': console.error(output); break;
        case 'warn':  console.warn(output); break;
        default:      console.log(output); break;
    }
}

/**
 * Log an API request (call at start of handler)
 * @param {string} endpoint - e.g. 'auth', 'stripe-checkout'
 * @param {string} method - HTTP method
 * @param {object} extra - Additional context (action, email, ip)
 */
export function logRequest(endpoint, method, extra = {}) {
    log('info', `${method} /api/${endpoint}`, { endpoint, method, ...extra });
}

/**
 * Log a successful operation
 * @param {string} endpoint
 * @param {string} action - What happened, e.g. 'user_registered', 'login_success'
 * @param {object} extra
 */
export function logSuccess(endpoint, action, extra = {}) {
    log('info', action, { endpoint, action, ...extra });
}

/**
 * Log a warning (validation failure, rate limit, etc.)
 * @param {string} endpoint
 * @param {string} reason
 * @param {object} extra
 */
export function logWarn(endpoint, reason, extra = {}) {
    log('warn', reason, { endpoint, ...extra });
}

/**
 * Log an error with full context
 * @param {string} endpoint
 * @param {Error|string} error
 * @param {object} extra
 */
export function logError(endpoint, error, extra = {}) {
    const errorData = error instanceof Error
        ? { errorName: error.name, errorMsg: error.message, stack: error.stack?.split('\n').slice(0, 5).join('\n') }
        : { errorMsg: String(error) };

    log('error', `Error in /api/${endpoint}`, { endpoint, ...errorData, ...extra });
}

/**
 * Measure and log execution time
 * @param {string} label - What was measured, e.g. 'db_query', 'stripe_create_session'
 * @returns {{ end: () => number }} Call .end() to get elapsed ms and log it
 */
export function logTimer(label) {
    const start = Date.now();
    return {
        end(extra = {}) {
            const elapsed = Date.now() - start;
            log('info', `${label} completed`, { label, durationMs: elapsed, ...extra });
            return elapsed;
        }
    };
}

export default { logRequest, logSuccess, logWarn, logError, logTimer };
