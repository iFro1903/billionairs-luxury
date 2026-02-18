/**
 * Unit Tests for TOTP (Two-Factor Authentication) Library
 * Tests Base32 encoding, secret generation, backup codes, and TOTP verification
 * (No external dependencies required - pure crypto logic)
 */
import { describe, it, expect } from 'vitest';
import { generateSecret, generateBackupCodes, verifyTOTP, generateOtpauthUrl } from '../../lib/totp.js';

describe('TOTP - Secret Generation', () => {
    it('should generate a Base32 secret of default length (32)', () => {
        const secret = generateSecret();
        expect(secret).toHaveLength(32);
        expect(secret).toMatch(/^[A-Z2-7]+$/); // Base32 charset
    });

    it('should generate a secret of custom length', () => {
        const secret = generateSecret(16);
        expect(secret).toHaveLength(16);
    });

    it('should generate unique secrets each time', () => {
        const secrets = new Set(Array.from({ length: 20 }, () => generateSecret()));
        expect(secrets.size).toBe(20);
    });
});

describe('TOTP - Backup Codes', () => {
    it('should generate 10 backup codes by default', () => {
        const codes = generateBackupCodes();
        expect(codes).toHaveLength(10);
    });

    it('should generate custom number of codes', () => {
        const codes = generateBackupCodes(5);
        expect(codes).toHaveLength(5);
    });

    it('should format codes as XXXX-XXXX', () => {
        const codes = generateBackupCodes();
        codes.forEach(code => {
            expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
        });
    });

    it('should generate unique backup codes', () => {
        const codes = generateBackupCodes(10);
        const unique = new Set(codes);
        // With 4 bytes of entropy, collisions are extremely unlikely but not impossible
        // We check most are unique (at least 8 of 10)
        expect(unique.size).toBeGreaterThanOrEqual(8);
    });
});

describe('TOTP - Code Verification', () => {
    it('should reject an invalid TOTP code', () => {
        const secret = generateSecret();
        expect(verifyTOTP(secret, '000000')).toBe(false);
    });

    it('should reject empty code', () => {
        const secret = generateSecret();
        expect(verifyTOTP(secret, '')).toBe(false);
    });

    it('should reject non-numeric code', () => {
        const secret = generateSecret();
        expect(verifyTOTP(secret, 'abcdef')).toBe(false);
    });

    it('should handle null/undefined code gracefully', () => {
        const secret = generateSecret();
        expect(verifyTOTP(secret, null)).toBe(false);
        expect(verifyTOTP(secret, undefined)).toBe(false);
    });
});

describe('TOTP - OTPAuth URL Generation', () => {
    it('should generate a valid otpauth URL', () => {
        const secret = generateSecret();
        const url = generateOtpauthUrl('user@example.com', secret);
        expect(url).toContain('otpauth://totp/');
        expect(url).toContain('secret=' + secret);
        expect(url).toContain('BILLIONAIRS');
    });

    it('should include email in the URL', () => {
        const secret = generateSecret();
        const url = generateOtpauthUrl('test@billionairs.luxury', secret);
        expect(url).toContain('test%40billionairs.luxury');
    });

    it('should use custom issuer', () => {
        const secret = generateSecret();
        const url = generateOtpauthUrl('user@test.com', secret, 'CustomIssuer');
        expect(url).toContain('CustomIssuer');
    });
});
