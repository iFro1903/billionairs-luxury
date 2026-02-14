/**
 * Shared CORS utility for BILLIONAIRS API
 * Works in both Edge Runtime and Node.js
 */

const ALLOWED_ORIGINS = [
    'https://billionairs.luxury',
    'https://www.billionairs.luxury'
];

/**
 * Get the correct CORS origin from request headers
 * Supports both Edge (req.headers.get) and Node.js (req.headers[]) formats
 * @param {Request|Object} req - Request object
 * @returns {string} Allowed origin or default
 */
export function getCorsOrigin(req) {
    let origin;
    
    // Edge Runtime format
    if (typeof req.headers?.get === 'function') {
        origin = req.headers.get('origin');
    } else {
        // Node.js format
        origin = req.headers?.origin || req.headers?.['origin'];
    }
    
    return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

/**
 * Set standard CORS headers on a Node.js response object
 * @param {Object} res - Node.js response object
 * @param {Request|Object} req - Request object
 * @param {string} [methods='GET,OPTIONS,POST,PUT,DELETE'] - Allowed methods
 */
export function setCorsHeaders(res, req, methods = 'GET,OPTIONS,POST,PUT,DELETE') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-email, x-admin-password');
}
