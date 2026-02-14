import { describe, it, expect } from 'vitest';
import { generateMemberId } from '../../lib/helpers.js';

describe('helpers', () => {

    describe('generateMemberId', () => {
        it('should start with BILL-', () => {
            const id = generateMemberId();
            expect(id).toMatch(/^BILL-/);
        });

        it('should have correct format: BILL-{timestamp}-{random}', () => {
            const id = generateMemberId();
            const parts = id.split('-');
            // BILL, timestamp, random (may contain hyphens from random? No — substr(2,9))
            expect(parts[0]).toBe('BILL');
            // Timestamp should be a valid number
            expect(Number(parts[1])).toBeGreaterThan(0);
            // Random part should be uppercase alphanumeric
            expect(parts[2]).toMatch(/^[A-Z0-9]+$/);
        });

        it('should generate unique IDs', () => {
            const ids = new Set();
            for (let i = 0; i < 100; i++) {
                ids.add(generateMemberId());
            }
            expect(ids.size).toBe(100);
        });

        it('should contain a recent timestamp', () => {
            const before = Date.now();
            const id = generateMemberId();
            const after = Date.now();
            const timestamp = parseInt(id.split('-')[1], 10);
            expect(timestamp).toBeGreaterThanOrEqual(before);
            expect(timestamp).toBeLessThanOrEqual(after);
        });
    });
});
