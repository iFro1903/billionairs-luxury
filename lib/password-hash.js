// Edge-kompatibles Password Hashing mit Web Crypto API
// PBKDF2 mit 100.000 Iterationen - industriestandard Sicherheit
// Kompatibel mit Vercel Edge Runtime

const PBKDF2_ITERATIONS = 100000;
const HASH_ALGORITHM = 'SHA-256';
const KEY_LENGTH = 256; // bits

/**
 * Hash ein Passwort mit PBKDF2 (100k Iterationen)
 * @param {string} password - Das zu hashende Passwort
 * @returns {Promise<string>} Der Hash im Format: pbkdf2$iterations$salt$hash
 */
export async function hashPassword(password) {
    // Generate 16-byte random salt
    const saltBuffer = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(saltBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Import password as key material
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    
    // Derive key with PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations: PBKDF2_ITERATIONS,
            hash: HASH_ALGORITHM
        },
        keyMaterial,
        KEY_LENGTH
    );
    
    // Convert to hex
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Return format: pbkdf2$iterations$salt$hash
    return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

/**
 * Verify ein Passwort gegen einen Hash
 * Unterstützt PBKDF2 (neu) und SHA-256 Legacy-Hashes (alt)
 * @param {string} password - Das zu prüfende Passwort
 * @param {string} storedHash - Der gespeicherte Hash
 * @returns {Promise<{valid: boolean, needsUpgrade: boolean}>} Ergebnis mit Upgrade-Flag
 */
export async function verifyPassword(password, storedHash) {
    if (!storedHash) return { valid: false, needsUpgrade: false };
    
    // Detect hash format
    if (storedHash.startsWith('pbkdf2$')) {
        // New PBKDF2 format: pbkdf2$iterations$salt$hash
        const parts = storedHash.split('$');
        if (parts.length !== 4) return { valid: false, needsUpgrade: false };
        
        const [, iterStr, saltHex, expectedHash] = parts;
        const iterations = parseInt(iterStr, 10);
        
        // Reconstruct salt from hex
        const saltBytes = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
        
        // Import password as key material
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );
        
        // Derive key with same parameters
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations: iterations,
                hash: HASH_ALGORITHM
            },
            keyMaterial,
            KEY_LENGTH
        );
        
        const hashArray = Array.from(new Uint8Array(derivedBits));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return { valid: timingSafeEqual(hashHex, expectedHash), needsUpgrade: false };
    }
    
    // Legacy SHA-256 format: salt$hash (UUID salt)
    const [salt, hash] = storedHash.split('$');
    if (!salt || !hash) return { valid: false, needsUpgrade: false };
    
    const combined = salt + password;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const valid = timingSafeEqual(hashHex, hash);
    // If valid with legacy hash, flag for upgrade to PBKDF2
    return { valid, needsUpgrade: valid };
}

/**
 * Legacy-kompatible Verify-Funktion (gibt nur boolean zurück)
 * Für Stellen die kein Upgrade brauchen (z.B. Admin-Auth)
 */
export async function verifyPasswordSimple(password, storedHash) {
    const result = await verifyPassword(password, storedHash);
    return result.valid;
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
