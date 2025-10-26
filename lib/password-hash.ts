/**
 * Edge-compatible Password Hashing with Web Crypto API
 * Replaces bcrypt for Vercel Edge Runtime
 */

/**
 * Hash a password with SHA-256 + Salt
 * @param password - The password to hash
 * @returns The hash in format: salt$hash
 */
export async function hashPassword(password: string): Promise<string> {
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
 * Verify a password against a hash
 * @param password - The password to verify
 * @param storedHash - The stored hash (salt$hash format)
 * @returns True if password is correct
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Split salt and hash
  const parts = storedHash.split('$');
  if (parts.length !== 2) {
    return false;
  }
  
  const [salt, hash] = parts;
  
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
 * Prevents timing attacks by ensuring comparison always takes same time
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
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
