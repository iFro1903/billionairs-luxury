/**
 * E2E Tests: Security Headers
 * Verifies all critical security headers are set correctly on the live site
 */
import { test, expect } from '@playwright/test';

test.describe('Security Headers', () => {
    let response;

    test.beforeEach(async ({ page }) => {
        response = await page.goto('/');
    });

    test('should set Content-Security-Policy header', async () => {
        const csp = response.headers()['content-security-policy'];
        expect(csp).toBeTruthy();
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain('script-src');
        expect(csp).toContain('style-src');
    });

    test('CSP should allow Stripe scripts', async () => {
        const csp = response.headers()['content-security-policy'];
        expect(csp).toContain('https://js.stripe.com');
    });

    test('CSP should allow Google Analytics', async () => {
        const csp = response.headers()['content-security-policy'];
        expect(csp).toContain('https://www.googletagmanager.com');
    });

    test('should set X-Content-Type-Options to nosniff', async () => {
        const header = response.headers()['x-content-type-options'];
        expect(header).toBe('nosniff');
    });

    test('should set X-Frame-Options', async () => {
        const header = response.headers()['x-frame-options'];
        expect(header).toBeTruthy();
        expect(['DENY', 'SAMEORIGIN']).toContain(header);
    });

    test('should set Referrer-Policy', async () => {
        const header = response.headers()['referrer-policy'];
        expect(header).toBeTruthy();
    });

    test('should set Strict-Transport-Security (HSTS)', async () => {
        const header = response.headers()['strict-transport-security'];
        expect(header).toBeTruthy();
        expect(header).toContain('max-age=');
    });

    test('should set X-XSS-Protection', async () => {
        const header = response.headers()['x-xss-protection'];
        expect(header).toBeTruthy();
    });

    test('should serve over HTTPS', async ({ page }) => {
        const url = page.url();
        expect(url).toMatch(/^https:\/\//);
    });

    test('should set correct Cache-Control for HTML', async () => {
        const cacheControl = response.headers()['cache-control'];
        // HTML should not have aggressive caching
        if (cacheControl) {
            expect(cacheControl).not.toContain('max-age=31536000'); // Not 1 year
        }
    });
});

test.describe('API Security', () => {
    test('API should reject GET on POST-only endpoints', async ({ request }) => {
        const response = await request.get('/api/stripe-checkout');
        expect(response.status()).toBe(405);
    });

    test('API should require auth for protected endpoints', async ({ request }) => {
        const response = await request.post('/api/chat', {
            data: { message: 'test' }
        });
        expect([401, 403]).toContain(response.status());
    });

    test('API should have CORS headers', async ({ request }) => {
        const response = await request.fetch('/api/health', {
            method: 'OPTIONS',
        });
        const headers = response.headers();
        expect(headers['access-control-allow-methods']).toBeTruthy();
    });
});
