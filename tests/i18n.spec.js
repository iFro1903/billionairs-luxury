// ============================================================================
// E2E Tests: Multi-Language Support (Feature #20)
// ============================================================================
// Tests for language switcher, translations, cookie persistence

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://www.billionairs.luxury';

test.describe('Multi-Language Support', () => {
  
  test('should load with German as default language', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check that German is active
    const activeButton = page.locator('button[data-lang="de"].active');
    await expect(activeButton).toBeVisible();
    
    // Check German text in navigation
    await expect(page.locator('nav')).toContainText('Startseite');
  });

  test('should switch language from German to English', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Verify initial German text
    const heroSection = page.locator('.hero-content');
    await expect(heroSection).toContainText('Willkommen');
    
    // Click EN button
    await page.click('button[data-lang="en"]');
    await page.waitForTimeout(500);
    
    // Verify text changed to English
    await expect(heroSection).toContainText('Welcome');
    
    // Check navigation items translated
    await expect(page.locator('nav')).toContainText('Home');
    
    // Verify EN button is now active
    const activeButton = page.locator('button[data-lang="en"].active');
    await expect(activeButton).toBeVisible();
  });

  test('should set language cookie when switching', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Switch to English
    await page.click('button[data-lang="en"]');
    await page.waitForTimeout(500);
    
    // Check cookie was set
    const cookies = await page.context().cookies();
    const langCookie = cookies.find(c => c.name === 'billionairs_lang');
    
    expect(langCookie).toBeDefined();
    expect(langCookie.value).toBe('en');
    expect(langCookie.sameSite).toBe('Lax');
  });

  test('should persist language after page reload', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Switch to English
    await page.click('button[data-lang="en"]');
    await page.waitForTimeout(500);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify language is still English
    const heroSection = page.locator('.hero-content');
    await expect(heroSection).toContainText('Welcome');
    
    // Verify EN button is active
    const activeButton = page.locator('button[data-lang="en"].active');
    await expect(activeButton).toBeVisible();
  });

  test('should switch back to German', async ({ page }) => {
    // Start with English
    await page.context().addCookies([{
      name: 'billionairs_lang',
      value: 'en',
      domain: 'www.billionairs.luxury',
      path: '/',
      sameSite: 'Lax'
    }]);
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Verify English is active
    await expect(page.locator('.hero-content')).toContainText('Welcome');
    
    // Switch to German
    await page.click('button[data-lang="de"]');
    await page.waitForTimeout(500);
    
    // Verify German text
    await expect(page.locator('.hero-content')).toContainText('Willkommen');
    
    // Check cookie updated
    const cookies = await page.context().cookies();
    const langCookie = cookies.find(c => c.name === 'billionairs_lang');
    expect(langCookie.value).toBe('de');
  });

  test('should translate all navigation items', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // German navigation
    const nav = page.locator('nav');
    await expect(nav).toContainText('Startseite');
    await expect(nav).toContainText('Dienstleistungen');
    
    // Switch to English
    await page.click('button[data-lang="en"]');
    await page.waitForTimeout(500);
    
    // English navigation
    await expect(nav).toContainText('Home');
    await expect(nav).toContainText('Services');
  });

  test('should translate hero section', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const hero = page.locator('.hero-content');
    
    // German
    await expect(hero).toContainText('Willkommen');
    await expect(hero).toContainText('Exklusive Mitgliedschaft');
    
    // Switch to English
    await page.click('button[data-lang="en"]');
    await page.waitForTimeout(500);
    
    // English
    await expect(hero).toContainText('Welcome');
    await expect(hero).toContainText('Exclusive Membership');
  });

  test('should translate service cards', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const services = page.locator('.services');
    
    // German
    await expect(services).toContainText('Premium-Mitgliedschaft');
    
    // Switch to English
    await page.click('button[data-lang="en"]');
    await page.waitForTimeout(500);
    
    // English
    await expect(services).toContainText('Premium Membership');
  });

  test('should translate footer', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const footer = page.locator('footer');
    
    // German
    await expect(footer).toContainText('Alle Rechte vorbehalten');
    
    // Switch to English
    await page.click('button[data-lang="en"]');
    await page.waitForTimeout(500);
    
    // English
    await expect(footer).toContainText('All rights reserved');
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Language switcher should still be visible
    await expect(page.locator('button[data-lang="en"]')).toBeVisible();
    
    // Switch language
    await page.click('button[data-lang="en"]');
    await page.waitForTimeout(500);
    
    // Verify translation works on mobile
    await expect(page.locator('.hero-content')).toContainText('Welcome');
  });
});

test.describe('i18n Edge Cases', () => {
  
  test('should handle rapid language switching', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Rapid switches
    await page.click('button[data-lang="en"]');
    await page.waitForTimeout(100);
    await page.click('button[data-lang="de"]');
    await page.waitForTimeout(100);
    await page.click('button[data-lang="en"]');
    await page.waitForTimeout(500);
    
    // Should end up in English
    await expect(page.locator('.hero-content')).toContainText('Welcome');
  });

  test('should handle invalid cookie value gracefully', async ({ page }) => {
    // Set invalid language cookie
    await page.context().addCookies([{
      name: 'billionairs_lang',
      value: 'invalid',
      domain: 'www.billionairs.luxury',
      path: '/',
      sameSite: 'Lax'
    }]);
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Should fallback to German (default)
    await expect(page.locator('.hero-content')).toContainText('Willkommen');
  });

  test('should dispatch languageChanged event', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Listen for event
    const eventPromise = page.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('languageChanged', (e) => {
          resolve(e.detail.language);
        });
      });
    });
    
    // Switch language
    await page.click('button[data-lang="en"]');
    
    // Verify event was dispatched
    const eventLanguage = await eventPromise;
    expect(eventLanguage).toBe('en');
  });
});
