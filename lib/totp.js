// TOTP (Time-based One-Time Password) Library
// RFC 6238 compliant implementation using Node.js crypto
// Compatible with Google Authenticator, Microsoft Authenticator, Authy, etc.

import { createHmac, randomBytes } from 'crypto';

// Base32 character set (RFC 4648)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generate a cryptographically secure Base32 secret
 * @param {number} length - Number of Base32 characters (default: 32)
 * @returns {string} Base32-encoded secret
 */
export function generateSecret(length = 32) {
    const bytes = randomBytes(length);
    let secret = '';
    for (let i = 0; i < length; i++) {
        secret += BASE32_CHARS[bytes[i] % BASE32_CHARS.length];
    }
    return secret;
}

/**
 * Generate backup codes for account recovery
 * @param {number} count - Number of codes (default: 10)
 * @returns {string[]} Array of backup codes (format: XXXX-XXXX)
 */
export function generateBackupCodes(count = 10) {
    return Array.from({ length: count }, () => {
        const bytes = randomBytes(4);
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
    });
}

/**
 * Decode a Base32 string to a Buffer
 * @param {string} base32 - Base32-encoded string
 * @returns {Buffer}
 */
function base32Decode(base32) {
    let bits = '';
    const cleaned = base32.replace(/[\s=-]/g, '').toUpperCase();
    for (let i = 0; i < cleaned.length; i++) {
        const val = BASE32_CHARS.indexOf(cleaned[i]);
        if (val === -1) continue;
        bits += val.toString(2).padStart(5, '0');
    }
    const bytes = Buffer.alloc(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
    }
    return bytes;
}

/**
 * Generate a TOTP code for the given time step
 * @param {string} secret - Base32-encoded secret
 * @param {number} timeStep - Time step counter
 * @returns {string} 6-digit TOTP code
 */
function generateTOTP(secret, timeStep) {
    const key = base32Decode(secret);
    
    // Convert time step to 8-byte big-endian buffer
    const timeBuffer = Buffer.alloc(8);
    let t = timeStep;
    for (let i = 7; i >= 0; i--) {
        timeBuffer[i] = t & 0xff;
        t = Math.floor(t / 256);
    }
    
    // HMAC-SHA1 (standard for TOTP per RFC 6238)
    const hmac = createHmac('sha1', key);
    hmac.update(timeBuffer);
    const hash = hmac.digest();
    
    // Dynamic truncation (RFC 4226)
    const offset = hash[hash.length - 1] & 0x0f;
    const binary = ((hash[offset] & 0x7f) << 24) |
                   ((hash[offset + 1] & 0xff) << 16) |
                   ((hash[offset + 2] & 0xff) << 8) |
                   (hash[offset + 3] & 0xff);
    
    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
}

/**
 * Verify a TOTP code with time window tolerance
 * @param {string} secret - Base32-encoded secret
 * @param {string} code - 6-digit code to verify
 * @param {number} window - Number of time steps to check before/after (default: 1)
 * @returns {boolean} Whether the code is valid
 */
export function verifyTOTP(secret, code, window = 2) {
    if (!secret || !code) return false;
    
    // Ensure code is a string
    const codeStr = String(code).trim();
    if (codeStr.length !== 6 || !/^\d{6}$/.test(codeStr)) return false;
    
    const timeStep = Math.floor(Date.now() / 1000 / 30);
    
    for (let i = -window; i <= window; i++) {
        if (generateTOTP(secret, timeStep + i) === codeStr) {
            return true;
        }
    }
    return false;
}

/**
 * Generate an otpauth:// URL for QR code scanning
 * @param {string} email - User's email address
 * @param {string} secret - Base32-encoded secret
 * @param {string} issuer - App name (default: 'BILLIONAIRS')
 * @returns {string} otpauth:// URL
 */
export function generateOtpauthUrl(email, secret, issuer = 'BILLIONAIRS') {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
