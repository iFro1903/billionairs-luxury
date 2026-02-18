/**
 * Unit Tests for Rate Limiter Configuration
 * Tests the exported configurations and helper functions
 * (No database required - tests pure logic only)
 */
import { describe, it, expect } from 'vitest';
import { getClientIp, RATE_LIMITS } from '../../lib/rate-limiter.js';

describe('Rate Limiter - RATE_LIMITS Configuration', () => {
    it('should define AUTH rate limit with correct values', () => {
        expect(RATE_LIMITS.AUTH).toBeDefined();
        expect(RATE_LIMITS.AUTH.maxRequests).toBe(10);
        expect(RATE_LIMITS.AUTH.windowMs).toBe(15 * 60 * 1000); // 15 min
        expect(RATE_LIMITS.AUTH.endpoint).toBe('auth');
        expect(RATE_LIMITS.AUTH.message).toBeTruthy();
    });

    it('should define PASSWORD_RESET with stricter limits than AUTH', () => {
        expect(RATE_LIMITS.PASSWORD_RESET).toBeDefined();
        expect(RATE_LIMITS.PASSWORD_RESET.maxRequests).toBeLessThan(RATE_LIMITS.AUTH.maxRequests);
        expect(RATE_LIMITS.PASSWORD_RESET.windowMs).toBeGreaterThan(RATE_LIMITS.AUTH.windowMs);
    });

    it('should define STRIPE_CHECKOUT with limited attempts', () => {
        expect(RATE_LIMITS.STRIPE_CHECKOUT).toBeDefined();
        expect(RATE_LIMITS.STRIPE_CHECKOUT.maxRequests).toBe(5);
        expect(RATE_LIMITS.STRIPE_CHECKOUT.windowMs).toBe(15 * 60 * 1000);
    });

    it('should define CHAT_POST with per-minute limits', () => {
        expect(RATE_LIMITS.CHAT_POST).toBeDefined();
        expect(RATE_LIMITS.CHAT_POST.maxRequests).toBe(15);
        expect(RATE_LIMITS.CHAT_POST.windowMs).toBe(60 * 1000); // 1 min
    });

    it('should define CHAT_GET with higher limit than CHAT_POST', () => {
        expect(RATE_LIMITS.CHAT_GET.maxRequests).toBeGreaterThan(RATE_LIMITS.CHAT_POST.maxRequests);
    });

    it('should define all required rate limit properties', () => {
        const requiredKeys = ['maxRequests', 'windowMs', 'endpoint', 'message'];
        Object.keys(RATE_LIMITS).forEach(key => {
            requiredKeys.forEach(prop => {
                expect(RATE_LIMITS[key][prop], `${key} missing ${prop}`).toBeDefined();
            });
        });
    });

    it('should have unique endpoints for each rate limit', () => {
        const endpoints = Object.values(RATE_LIMITS).map(rl => rl.endpoint);
        const unique = new Set(endpoints);
        expect(unique.size).toBe(endpoints.length);
    });
});

describe('Rate Limiter - getClientIp', () => {
    it('should extract IP from x-forwarded-for header (Node.js format)', () => {
        const req = { headers: { 'x-forwarded-for': '203.0.113.50, 70.41.3.18, 150.172.238.178' } };
        expect(getClientIp(req)).toBe('203.0.113.50');
    });

    it('should extract IP from x-real-ip header', () => {
        const req = { headers: { 'x-real-ip': '192.168.1.1' } };
        expect(getClientIp(req)).toBe('192.168.1.1');
    });

    it('should return "unknown" when no IP headers present', () => {
        const req = { headers: {} };
        expect(getClientIp(req)).toBe('unknown');
    });

    it('should handle Edge Runtime format (headers.get)', () => {
        const headers = new Map([['x-forwarded-for', '10.0.0.1, 10.0.0.2']]);
        headers.get = headers.get.bind(headers);
        const req = { headers };
        expect(getClientIp(req)).toBe('10.0.0.1');
    });

    it('should trim whitespace from forwarded IPs', () => {
        const req = { headers: { 'x-forwarded-for': '  203.0.113.50  , 70.41.3.18' } };
        expect(getClientIp(req)).toBe('203.0.113.50');
    });
});
