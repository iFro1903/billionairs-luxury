// Edge-kompatibles Password Hashing mit Web Crypto API
// Ersetzt bcrypt für Vercel Edge Runtime

/**
 * Hash ein Passwort mit SHA-256 + Salt
 * @param {string} password - Das zu hashende Passwort
 * @returns {Promise<string>} Der Hash im Format: salt$hash
 */
export async function hashPassword(password) {
    // Generate random salt
    const salt = crypto.randomUUID();
    
    // Combine password with salt
    const combined = salt + password;
    
    // Hash with SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Return salt$hash format
    return `${salt}$${hashHex}`;
}

/**
 * Verify ein Passwort gegen einen Hash
 * @param {string} password - Das zu prüfende Passwort
 * @param {string} storedHash - Der gespeicherte Hash (salt$hash format)
 * @returns {Promise<boolean>} True wenn Passwort korrekt
 */
export async function verifyPassword(password, storedHash) {
    // Split salt and hash
    const [salt, hash] = storedHash.split('$');
    
    if (!salt || !hash) {
        return false;
    }
    
    // Hash the provided password with the same salt
    const combined = salt + password;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Compare hashes (constant-time comparison)
    return timingSafeEqual(hashHex, hash);
}

/**
 * Timing-safe string comparison
 * @param {string} a 
 * @param {string} b 
 * @returns {boolean}
 */
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
}
