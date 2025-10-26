import { test, expect } from '@playwright/test';

/**
 * Homepage Smoke Tests
 * 
 * Grundlegende Tests um sicherzustellen, dass die Hauptseite funktioniert:
 * - Seite lädt erfolgreich
 * - Wichtige Elemente sind sichtbar
 * - Links funktionieren
 * - Performance ist akzeptabel
 */

test.describe('Homepage', () => {
  
  test('should load homepage successfully', async ({ page }) => {
    const response = await page.goto('/');
    
    expect(response.status()).toBe(200);
    await expect(page).toHaveTitle(/BILLIONAIRS/i);
  });

  test('should display main heading and call-to-action', async ({ page }) => {
    await page.goto('/');
    
    // Prüfe ob Hauptüberschrift vorhanden ist (es gibt mehrere H1, nehme das erste)
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    
    // Prüfe ob CTA Button vorhanden ist
    const ctaButton = page.locator('button, a[class*="btn"], a[class*="cta"]').first();
    await expect(ctaButton).toBeVisible();
  });

  test('should have cookie consent banner', async ({ page }) => {
    // Lösche vorher gespeicherte Cookie Preferences
    await page.context().clearCookies();
    
    await page.goto('/');
    
    // Cookie Banner sollte erscheinen (mehrere Elemente mit dieser Klasse, nehme erstes)
    const cookieBanner = page.locator('#cookieConsentBanner').first();
    await expect(cookieBanner).toBeVisible({ timeout: 3000 });
    
    // Buttons sollten vorhanden sein
    const acceptButton = page.locator('button:has-text("Accept All"), button:has-text("Alle akzeptieren")').first();
    await expect(acceptButton).toBeVisible();
  });

  test('should hide cookie banner after accepting', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    
    // Warte auf Cookie Banner - kann etwas dauern bis JavaScript lädt
    const cookieBanner = page.locator('#cookieConsentBanner');
    
    // Warte darauf dass Banner erscheint oder bereits da ist
    await page.waitForTimeout(1000); // Gib JavaScript Zeit zum Laden
    
    // Prüfe ob Banner sichtbar ist (könnte schon hidden sein wenn Cookie gesetzt)
    const isVisible = await cookieBanner.isVisible().catch(() => false);
    
    if (isVisible) {
      // Klicke "Accept All"
      const acceptButton = page.locator('button#acceptAllCookies, button:has-text("Accept All")');
      await acceptButton.click();
      
      // Banner sollte verschwinden
      await expect(cookieBanner).toBeHidden({ timeout: 5000 });
    }
    
    // Cookie sollte gesetzt sein (entweder vom Test oder schon vorher)
    const cookies = await page.context().cookies();
    const consentCookie = cookies.find(c => c.name === 'cookie_consent');
    expect(consentCookie).toBeTruthy();
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/');
    
    // Meta Description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.{10,}/); // Mindestens 10 Zeichen
    
    // Open Graph Tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /.+/);
    
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /https?:\/\/.+/);
  });

  test('should have valid PWA manifest', async ({ request }) => {
    const response = await request.get('/manifest.json');
    
    expect(response.status()).toBe(200);
    
    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should load all PWA icons successfully', async ({ request }) => {
    // Lade manifest
    const manifestResponse = await request.get('/manifest.json');
    const manifest = await manifestResponse.json();
    
    // Prüfe alle Icons
    for (const icon of manifest.icons) {
      const iconResponse = await request.get(icon.src);
      expect(iconResponse.status()).toBe(200);
      expect(iconResponse.headers()['content-type']).toContain('image');
    }
  });

  test('should have Google Analytics installed', async ({ page }) => {
    await page.goto('/');
    
    // Warte kurz damit GA laden kann
    await page.waitForTimeout(2000);
    
    // Prüfe ob GA Script geladen wurde
    const gaScript = page.locator('script[src*="googletagmanager.com"]');
    await expect(gaScript).toHaveCount(1);
    
    // Prüfe ob gtag Funktion existiert
    const hasGtag = await page.evaluate(() => typeof window.gtag === 'function');
    expect(hasGtag).toBeTruthy();
  });

  test('should not have console errors on load', async ({ page }) => {
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filtere bekannte/erwartete Errors (z.B. CSP Warnings)
    const criticalErrors = errors.filter(err => 
      !err.includes('Content Security Policy') &&
      !err.includes('favicon')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have acceptable page load performance', async ({ page }) => {
    await page.goto('/');
    
    // Measure performance
    const performanceMetrics = await page.evaluate(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0];
      return {
        loadTime: perfData.loadEventEnd - perfData.fetchStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
        responseTime: perfData.responseEnd - perfData.requestStart
      };
    });
    
    console.log('Performance metrics:', performanceMetrics);
    
    // Page should load within 3 seconds
    expect(performanceMetrics.loadTime).toBeLessThan(3000);
  });

  test('should have all security headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response.headers();
    
    // Security Headers
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-xss-protection']).toBeTruthy();
    expect(headers['content-security-policy']).toBeTruthy();
    expect(headers['referrer-policy']).toBeTruthy();
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('/');
    
    // Seite sollte responsive sein
    const body = page.locator('body');
    const width = await body.evaluate(el => el.scrollWidth);
    
    // Keine horizontale Scrollbar
    expect(width).toBeLessThanOrEqual(375);
  });
});
