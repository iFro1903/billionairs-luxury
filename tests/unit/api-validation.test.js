import { describe, it, expect } from 'vitest';

/**
 * API Integration Tests for BILLIONAIRS
 * 
 * Tests the live API endpoints for correct behavior.
 * Focus: Method validation, auth checks, CORS, rate-limit headers.
 * These tests are safe — they do NOT create data or make payments.
 */

const BASE_URL = process.env.API_BASE_URL || 'https://www.billionairs.luxury';

// Helper: fetch with timeout
async function apiFetch(endpoint, options = {}) {
    const res = await fetch(`${BASE_URL}/api/${endpoint}`, {
        signal: AbortSignal.timeout(10000),
        ...options,
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = null; }
    return { status: res.status, json, headers: res.headers, text };
}

// ── Stripe Checkout ──
describe('API: /api/stripe-checkout', () => {
    it('should reject GET requests with 405', async () => {
        const { status } = await apiFetch('stripe-checkout', { method: 'GET' });
        expect(status).toBe(405);
    });
});

// ── Chat ──
describe('API: /api/chat', () => {
    it('should reject unauthenticated GET with 401', async () => {
        const { status } = await apiFetch('chat', { method: 'GET' });
        expect(status).toBe(401);
    });

    it('should reject unauthenticated POST with 401', async () => {
        const { status } = await apiFetch('chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'test' }),
        });
        expect(status).toBe(401);
    });
});

// ── Forgot Password ──
describe('API: /api/forgot-password', () => {
    it('should reject GET requests with 405', async () => {
        const { status } = await apiFetch('forgot-password', { method: 'GET' });
        expect(status).toBe(405);
    });
});

// ── CORS Security ──
describe('API: CORS headers', () => {
    it('should respond to OPTIONS on auth endpoint', async () => {
        const { status, headers } = await apiFetch('auth', {
            method: 'OPTIONS',
            headers: { 'Origin': 'https://www.billionairs.luxury' },
        });
        expect(status).toBe(200);
    });

    it('should set allow-origin header', async () => {
        const { headers } = await apiFetch('auth', {
            method: 'OPTIONS',
            headers: { 'Origin': 'https://www.billionairs.luxury' },
        });
        const origin = headers.get('access-control-allow-origin');
        expect(origin).toBeTruthy();
    });

    it('should not reflect arbitrary origins', async () => {
        const { headers } = await apiFetch('auth', {
            method: 'OPTIONS',
            headers: { 'Origin': 'https://evil-site.com' },
        });
        const origin = headers.get('access-control-allow-origin');
        if (origin) {
            expect(origin).not.toBe('https://evil-site.com');
        }
    });
});
