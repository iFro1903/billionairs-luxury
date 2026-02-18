/**
 * E2E Tests: Error Pages & Edge Cases
 * Tests 404 page, cookie policy, and other auxiliary pages
 */
import { test, expect } from '@playwright/test';

test.describe('404 Error Page', () => {
    test('should display custom 404 page for non-existent routes', async ({ page }) => {
        const response = await page.goto('/this-page-does-not-exist-12345');
        // Vercel should serve the custom 404 page
        const content = await page.textContent('body');
        expect(content).toBeTruthy();
    });

    test('should load 404.html directly', async ({ page }) => {
        const response = await page.goto('/404.html');
        expect(response.status()).toBeLessThan(500);
        const content = await page.textContent('body');
        expect(content).toBeTruthy();
    });

    test('404 page should have dark theme', async ({ page }) => {
        await page.goto('/404.html');
        const body = page.locator('body');
        const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);
        const rgbMatch = bgColor.match(/\d+/g);
        if (rgbMatch) {
            const [r, g, b] = rgbMatch.map(Number);
            expect(r).toBeLessThan(50);
        }
    });
});

test.describe('Cookie Policy Page', () => {
    test('should load cookie policy page', async ({ page }) => {
        const response = await page.goto('/cookie-policy.html');
        expect(response.status()).toBe(200);
    });

    test('should contain cookie-related content', async ({ page }) => {
        await page.goto('/cookie-policy.html');
        const content = await page.textContent('body');
        const lcContent = content.toLowerCase();
        expect(lcContent).toMatch(/cookie|datenschutz|privacy/);
    });
});

test.describe('Privacy Policy Page', () => {
    test('should load privacy policy page', async ({ page }) => {
        const response = await page.goto('/privacy-policy.html');
        expect(response.status()).toBe(200);
    });

    test('should contain privacy-related content', async ({ page }) => {
        await page.goto('/privacy-policy.html');
        const content = await page.textContent('body');
        expect(content.length).toBeGreaterThan(500); // Should have substantial content
    });
});

test.describe('Payment Result Pages', () => {
    test('should load payment success page', async ({ page }) => {
        const response = await page.goto('/payment-success.html');
        expect(response.status()).toBe(200);
    });

    test('should load payment cancelled page', async ({ page }) => {
        const response = await page.goto('/payment-cancelled.html');
        expect(response.status()).toBe(200);
    });

    test('payment success page should have positive messaging', async ({ page }) => {
        await page.goto('/payment-success.html');
        const content = await page.textContent('body');
        const lcContent = content.toLowerCase();
        expect(lcContent).toMatch(/success|thank|congratulations|erfolgreich|danke/);
    });
});

test.describe('Robots.txt & Sitemap', () => {
    test('should serve robots.txt', async ({ request }) => {
        const response = await request.get('/robots.txt');
        expect(response.status()).toBe(200);
        const text = await response.text();
        expect(text).toContain('User-agent');
    });

    test('should serve sitemap.xml', async ({ request }) => {
        const response = await request.get('/sitemap.xml');
        expect(response.status()).toBe(200);
        const text = await response.text();
        expect(text).toContain('<?xml');
        expect(text).toContain('billionairs');
    });
});

test.describe('PWA Manifest', () => {
    test('should serve manifest.json', async ({ request }) => {
        const response = await request.get('/manifest.json');
        expect(response.status()).toBe(200);
        const json = await response.json();
        expect(json.name).toBeTruthy();
        expect(json.icons).toBeTruthy();
    });
});
