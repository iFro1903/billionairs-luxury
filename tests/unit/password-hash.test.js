import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, verifyPasswordSimple } from '../../lib/password-hash.js';

describe('password-hash', () => {

    // ── hashPassword ──
    describe('hashPassword', () => {
        it('should return a string in pbkdf2$iterations$salt$hash format', async () => {
            const hash = await hashPassword('TestPassword123');
            const parts = hash.split('$');
            expect(parts).toHaveLength(4);
            expect(parts[0]).toBe('pbkdf2');
            expect(parts[1]).toBe('100000');
            expect(parts[2]).toHaveLength(32); // 16 bytes = 32 hex chars
            expect(parts[3]).toHaveLength(64); // 256 bits = 32 bytes = 64 hex chars
        });

        it('should generate different salts for the same password', async () => {
            const hash1 = await hashPassword('SamePassword');
            const hash2 = await hashPassword('SamePassword');
            expect(hash1).not.toBe(hash2);
            // But both should be valid
            const r1 = await verifyPassword('SamePassword', hash1);
            const r2 = await verifyPassword('SamePassword', hash2);
            expect(r1.valid).toBe(true);
            expect(r2.valid).toBe(true);
        });

        it('should handle empty string', async () => {
            const hash = await hashPassword('');
            expect(hash).toMatch(/^pbkdf2\$/);
        });

        it('should handle unicode passwords', async () => {
            const hash = await hashPassword('Pässwörd€123');
            const result = await verifyPassword('Pässwörd€123', hash);
            expect(result.valid).toBe(true);
        });

        it('should handle very long passwords', async () => {
            const longPassword = 'A'.repeat(1000);
            const hash = await hashPassword(longPassword);
            const result = await verifyPassword(longPassword, hash);
            expect(result.valid).toBe(true);
        });
    });

    // ── verifyPassword (PBKDF2) ──
    describe('verifyPassword (PBKDF2)', () => {
        it('should verify a correct password', async () => {
            const hash = await hashPassword('CorrectPassword');
            const result = await verifyPassword('CorrectPassword', hash);
            expect(result.valid).toBe(true);
            expect(result.needsUpgrade).toBe(false);
        });

        it('should reject an incorrect password', async () => {
            const hash = await hashPassword('CorrectPassword');
            const result = await verifyPassword('WrongPassword', hash);
            expect(result.valid).toBe(false);
        });

        it('should be case-sensitive', async () => {
            const hash = await hashPassword('Password');
            const result = await verifyPassword('password', hash);
            expect(result.valid).toBe(false);
        });

        it('should return false for null/undefined storedHash', async () => {
            const r1 = await verifyPassword('test', null);
            expect(r1.valid).toBe(false);
            const r2 = await verifyPassword('test', undefined);
            expect(r2.valid).toBe(false);
        });

        it('should return false for empty storedHash', async () => {
            const result = await verifyPassword('test', '');
            expect(result.valid).toBe(false);
        });

        it('should return false for malformed PBKDF2 hash', async () => {
            const result = await verifyPassword('test', 'pbkdf2$only$two');
            expect(result.valid).toBe(false);
        });
    });

    // ── verifyPassword (Legacy SHA-256) ──
    describe('verifyPassword (Legacy SHA-256)', () => {
        it('should verify a legacy SHA-256 hash and flag for upgrade', async () => {
            // Simulate a legacy hash: salt$sha256(salt + password)
            const password = 'LegacyTest123';
            const salt = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            const combined = salt + password;
            const encoder = new TextEncoder();
            const data = encoder.encode(combined);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            const legacyHash = `${salt}$${hashHex}`;

            const result = await verifyPassword(password, legacyHash);
            expect(result.valid).toBe(true);
            expect(result.needsUpgrade).toBe(true); // Legacy should flag upgrade
        });

        it('should reject wrong password with legacy hash', async () => {
            const salt = 'test-salt-uuid';
            const encoder = new TextEncoder();
            const data = encoder.encode(salt + 'RealPassword');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            const legacyHash = `${salt}$${hashHex}`;

            const result = await verifyPassword('WrongPassword', legacyHash);
            expect(result.valid).toBe(false);
            expect(result.needsUpgrade).toBe(false);
        });
    });

    // ── verifyPasswordSimple ──
    describe('verifyPasswordSimple', () => {
        it('should return true for correct password', async () => {
            const hash = await hashPassword('SimpleTest');
            const result = await verifyPasswordSimple('SimpleTest', hash);
            expect(result).toBe(true);
        });

        it('should return false for incorrect password', async () => {
            const hash = await hashPassword('SimpleTest');
            const result = await verifyPasswordSimple('WrongPassword', hash);
            expect(result).toBe(false);
        });
    });
});
