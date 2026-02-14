import { describe, it, expect } from 'vitest';
import { getCorsOrigin, setCorsHeaders } from '../../lib/cors.js';

describe('cors', () => {

    describe('getCorsOrigin', () => {
        it('should allow https://billionairs.luxury', () => {
            const req = { headers: { origin: 'https://billionairs.luxury' } };
            expect(getCorsOrigin(req)).toBe('https://billionairs.luxury');
        });

        it('should allow https://www.billionairs.luxury', () => {
            const req = { headers: { origin: 'https://www.billionairs.luxury' } };
            expect(getCorsOrigin(req)).toBe('https://www.billionairs.luxury');
        });

        it('should reject unknown origins and return default', () => {
            const req = { headers: { origin: 'https://evil-site.com' } };
            expect(getCorsOrigin(req)).toBe('https://billionairs.luxury');
        });

        it('should handle missing origin header', () => {
            const req = { headers: {} };
            expect(getCorsOrigin(req)).toBe('https://billionairs.luxury');
        });

        it('should handle null origin', () => {
            const req = { headers: { origin: null } };
            expect(getCorsOrigin(req)).toBe('https://billionairs.luxury');
        });

        it('should handle Edge Runtime request format (headers.get)', () => {
            // Edge Runtime uses Request-like objects with headers.get()
            const req = {
                headers: {
                    get: (name) => name === 'origin' ? 'https://www.billionairs.luxury' : null,
                },
            };
            expect(getCorsOrigin(req)).toBe('https://www.billionairs.luxury');
        });

        it('should reject http:// (non-SSL) origins', () => {
            const req = { headers: { origin: 'http://billionairs.luxury' } };
            expect(getCorsOrigin(req)).toBe('https://billionairs.luxury');
        });
    });

    describe('setCorsHeaders', () => {
        it('should set all required CORS headers', () => {
            const headers = {};
            const res = { setHeader: (k, v) => { headers[k] = v; } };
            const req = { headers: { origin: 'https://www.billionairs.luxury' } };

            setCorsHeaders(res, req);

            expect(headers['Access-Control-Allow-Credentials']).toBe('true');
            expect(headers['Access-Control-Allow-Origin']).toBe('https://www.billionairs.luxury');
            expect(headers['Access-Control-Allow-Methods']).toContain('POST');
            expect(headers['Access-Control-Allow-Methods']).toContain('GET');
            expect(headers['Access-Control-Allow-Headers']).toContain('Content-Type');
        });

        it('should use custom methods if provided', () => {
            const headers = {};
            const res = { setHeader: (k, v) => { headers[k] = v; } };
            const req = { headers: { origin: 'https://billionairs.luxury' } };

            setCorsHeaders(res, req, 'GET,POST');

            expect(headers['Access-Control-Allow-Methods']).toBe('GET,POST');
        });

        it('should include CSRF token in allowed headers', () => {
            const headers = {};
            const res = { setHeader: (k, v) => { headers[k] = v; } };
            const req = { headers: { origin: 'https://billionairs.luxury' } };

            setCorsHeaders(res, req);

            expect(headers['Access-Control-Allow-Headers']).toContain('X-CSRF-Token');
        });
    });
});
