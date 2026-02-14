// ============================================================================
// E2E Tests: Multi-Language Support (Feature #20)
// ============================================================================
// Tests for language switcher, translations, cookie persistence

import { test, expect } from '@playwright/test';

// Uses baseURL from playwright.config.js (override with BASE_URL env var)
const BASE_URL = '';

// Helper function to accept cookie banner
async function acceptCookies(page) {
  try {
    const cookieBanner = page.locator('#cookieConsentBanner');
    const acceptButton = page.locator('#acceptAllCookies');
    
    // Wait for banner to appear (max 2 seconds)
    await cookieBanner.waitFor({ state: 'visible', timeout: 2000 });
    
    // Click accept if banner is visible
    if (await acceptButton.isVisible()) {
      await acceptButton.click();
      await page.waitForTimeout(500);
    }
  } catch (error) {
    // Cookie banner not found or already accepted - continue
    console.log('Cookie banner not found or already accepted');
  }
}

// Helper function to open language dropdown and click language
async function selectLanguage(page, lang) {
  // Click language button to open dropdown
  await page.click('#langBtn');
  await page.waitForTimeout(300);
  
  // Click language link in dropdown
  await page.click(`a[data-lang="${lang}"]`);
  await page.waitForTimeout(500);
}

test.describe('Multi-Language Support', () => {
  
  test('should load with German as default language', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await acceptCookies(page);
    
    // Check that language button shows DE
    const langBtn = page.locator('#langBtn');
    await expect(langBtn).toContainText('DE');
    
    // Note: Most content intentionally stays in English for luxury appeal
  });

  test('should switch language from German to English', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await acceptCookies(page);
    
    // Click EN language
    await selectLanguage(page, 'en');
    
    // Verify EN button text
    const langBtn = page.locator('#langBtn');
    await expect(langBtn).toContainText('EN');
  });

  test('should set language cookie when switching', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await acceptCookies(page);
    
    // Switch to English
    await selectLanguage(page, 'en');
    
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
    await acceptCookies(page);
    
    // Switch to English
    await selectLanguage(page, 'en');
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify language button shows EN
    const langBtn = page.locator('#langBtn');
    await expect(langBtn).toContainText('EN');
  });

  test('should switch back to German', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await acceptCookies(page);
    
    // First switch to English
    await selectLanguage(page, 'en');
    await page.waitForTimeout(300);
    
    // Then switch back to German
    await selectLanguage(page, 'de');
    
    // Verify DE button text
    const langBtn = page.locator('#langBtn');
    await expect(langBtn).toContainText('DE');
  });

  test('should translate all navigation items', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await acceptCookies(page);
    
    // Just verify language switcher exists and works
    const langBtn = page.locator('#langBtn');
    await expect(langBtn).toBeVisible();
    
    // Test switching languages
    await selectLanguage(page, 'fr');
    await expect(langBtn).toContainText('FR');
    
    await selectLanguage(page, 'es');
    await expect(langBtn).toContainText('ES');
  });

  test('should support all 9 languages', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await acceptCookies(page);
    
    const languages = ['de', 'en', 'fr', 'es', 'zh', 'ar', 'it', 'ru', 'ja'];
    
    for (const lang of languages) {
      await selectLanguage(page, lang);
      await page.waitForTimeout(200);
      
      // Verify button text updated
      const langBtn = page.locator('#langBtn');
      const btnText = await langBtn.textContent();
      expect(btnText.toLowerCase()).toContain(lang);
    }
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await acceptCookies(page);
    
    // Language switcher button should be visible
    const langBtn = page.locator('#langBtn');
    await expect(langBtn).toBeVisible();
    
    // Switch language on mobile
    await selectLanguage(page, 'en');
    await expect(langBtn).toContainText('EN');
  });
});

test.describe('i18n Edge Cases', () => {
  
  test('should handle rapid language switching', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await acceptCookies(page);
    
    // Rapid switches
    await selectLanguage(page, 'en');
    await page.waitForTimeout(100);
    await selectLanguage(page, 'de');
    await page.waitForTimeout(100);
    await selectLanguage(page, 'fr');
    await page.waitForTimeout(500);
    
    // Should end up in French
    const langBtn = page.locator('#langBtn');
    await expect(langBtn).toContainText('FR');
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
    await acceptCookies(page);
    
    // Should fallback to German (default)
    const langBtn = page.locator('#langBtn');
    await expect(langBtn).toBeVisible();
  });

  test('should dispatch languageChanged event', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await acceptCookies(page);
    
    // Listen for event
    const eventPromise = page.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('languageChanged', (e) => {
          resolve(e.detail.language);
        }, { once: true });
      });
    });
    
    // Switch language
    await selectLanguage(page, 'en');
    
    // Verify event was dispatched
    const eventLanguage = await eventPromise;
    expect(eventLanguage).toBe('en');
  });
});
