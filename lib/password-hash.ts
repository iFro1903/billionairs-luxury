/**
 * Edge-compatible Password Hashing with Web Crypto API
 * PBKDF2 with 100,000 iterations - industry standard security
 * Compatible with Vercel Edge Runtime
 */

const PBKDF2_ITERATIONS = 100000;
const HASH_ALGORITHM = 'SHA-256';
const KEY_LENGTH = 256; // bits

/**
 * Hash a password with PBKDF2 (100k iterations)
 * @param password - The password to hash
 * @returns The hash in format: pbkdf2$iterations$salt$hash
 */
export async function hashPassword(password: string): Promise<string> {
  const saltBuffer = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(saltBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations: PBKDF2_ITERATIONS, hash: HASH_ALGORITHM },
    keyMaterial, KEY_LENGTH
  );
  
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

/**
 * Verify a password against a hash
 * Supports PBKDF2 (new) and SHA-256 legacy hashes (old)
 */
export async function verifyPassword(password: string, storedHash: string): Promise<{valid: boolean, needsUpgrade: boolean}> {
  if (!storedHash) return { valid: false, needsUpgrade: false };
  
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return { valid: false, needsUpgrade: false };
    const [, iterStr, saltHex, expectedHash] = parts;
    const iterations = parseInt(iterStr, 10);
    const saltBytes = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations, hash: HASH_ALGORITHM },
      keyMaterial, KEY_LENGTH
    );
    const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    return { valid: timingSafeEqual(hashHex, expectedHash), needsUpgrade: false };
  }
  
  // Legacy SHA-256 format: salt$hash
  const [salt, hash] = storedHash.split('$');
  if (!salt || !hash) return { valid: false, needsUpgrade: false };
  
  const combined = salt + password;
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const valid = timingSafeEqual(hashHex, hash);
  return { valid, needsUpgrade: valid };
}

/**
 * Simple verify that returns boolean only (for admin auth etc.)
 */
export async function verifyPasswordSimple(password: string, storedHash: string): Promise<boolean> {
  const result = await verifyPassword(password, storedHash);
  return result.valid;
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}
