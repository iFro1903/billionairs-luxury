/**
 * E2E Tests: NDA Signing Flow
 * Tests the NDA preview and signing page functionality
 */
import { test, expect } from '@playwright/test';

test.describe('NDA Signing Page', () => {
    test('should load NDA signing page', async ({ page }) => {
        await page.goto('/nda-signing.html?name=Test%20User&email=test@example.com&phone=+41000000000');
        await expect(page).toHaveTitle(/BILLIONAIRS|NDA/i);
    });

    test('should display NDA content', async ({ page }) => {
        await page.goto('/nda-signing.html?name=Test%20User&email=test@example.com&phone=+41000000000');
        // Should have some NDA-related content visible
        const content = await page.textContent('body');
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(100);
    });

    test('should have signature area', async ({ page }) => {
        await page.goto('/nda-signing.html?name=Test%20User&email=test@example.com&phone=+41000000000');
        await page.waitForLoadState('networkidle');
        // Look for canvas (signature pad) or signature-related elements
        const signatureElements = page.locator('canvas, .signature-pad, .signature-area, #signaturePad, #signature');
        const count = await signatureElements.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should populate name from URL parameters', async ({ page }) => {
        await page.goto('/nda-signing.html?name=John%20Doe&email=john@example.com&phone=+41000000000');
        await page.waitForLoadState('networkidle');
        const content = await page.textContent('body');
        expect(content).toContain('John Doe');
    });

    test('should have dark luxury theme', async ({ page }) => {
        await page.goto('/nda-signing.html?name=Test&email=test@example.com');
        const body = page.locator('body');
        const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);
        const rgbMatch = bgColor.match(/\d+/g);
        if (rgbMatch) {
            const [r, g, b] = rgbMatch.map(Number);
            expect(r).toBeLessThan(50);
        }
    });
});

test.describe('NDA Preview Pages', () => {
    test('should load NDA preview page', async ({ page }) => {
        const response = await page.goto('/preview-nda.html');
        expect(response.status()).toBeLessThan(400);
    });

    test('should load NDA PDF preview page', async ({ page }) => {
        const response = await page.goto('/nda-pdf-preview.html');
        expect(response.status()).toBeLessThan(400);
    });

    test('should load NDA preview launcher page', async ({ page }) => {
        const response = await page.goto('/nda-preview-launcher.html');
        expect(response.status()).toBeLessThan(400);
    });
});
