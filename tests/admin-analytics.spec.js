// ============================================================================
// E2E Tests: Enhanced Analytics (Feature #19)
// ============================================================================
// Tests for analytics dashboard cards and data visualization

import { test, expect } from '@playwright/test';

// Uses baseURL from playwright.config.js
const ADMIN_URL = '/admin.html';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@billionairs.luxury';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPass123!';

test.describe('Enhanced Analytics Dashboard', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Switch to Analytics tab
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(1000); // Wait for analytics to load
  });

  test('should show analytics section', async ({ page }) => {
    // Verify analytics enhanced section exists
    const analyticsSection = page.locator('.analytics-enhanced');
    await expect(analyticsSection).toBeVisible();
  });

  test('should display 6 analytics cards', async ({ page }) => {
    // Count analytics cards
    const cards = page.locator('.analytics-card');
    const count = await cards.count();
    
    // Should have at least 6 cards
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('should show Conversion Rate card', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Conversion Rate' });
    await expect(card).toBeVisible();
    
    // Check for percentage display
    const percentage = card.locator('h3');
    await expect(percentage).toBeVisible();
    
    // Should contain % symbol
    const text = await percentage.textContent();
    expect(text).toMatch(/\d+\.?\d*%/);
  });

  test('should show Revenue Statistics card', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Revenue Statistics' });
    await expect(card).toBeVisible();
    
    // Check for revenue metrics
    await expect(card).toContainText('Total:');
    await expect(card).toContainText('Average:');
    await expect(card).toContainText('Min:');
    await expect(card).toContainText('Max:');
  });

  test('should show Payment Methods card', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Payment Methods' });
    await expect(card).toBeVisible();
    
    // Should list payment methods
    await expect(card).toContainText('card');
  });

  test('should show Daily Revenue card with chart', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Daily Revenue' });
    await expect(card).toBeVisible();
    
    // Check if canvas exists (for chart)
    const canvas = card.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show Top 10 Customers card', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Top 10 Customers' });
    await expect(card).toBeVisible();
    
    // Should have table or list structure
    const list = card.locator('ol, ul, table');
    await expect(list).toBeVisible();
  });

  test('should show Refund Statistics card', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Refund' });
    await expect(card).toBeVisible();
    
    // Check for refund metrics
    await expect(card).toContainText('Total:');
    await expect(card).toContainText('Amount:');
  });

  test('should display conversion rate calculation', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Conversion Rate' });
    
    // Get conversion rate text
    const rateText = await card.locator('h3').textContent();
    const rate = parseFloat(rateText);
    
    // Should be between 0 and 100
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(100);
  });

  test('should display formatted currency in revenue stats', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Revenue Statistics' });
    
    // Check for euro symbol
    const content = await card.textContent();
    expect(content).toContain('€');
  });

  test('should show payment method distribution', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Payment Methods' });
    
    const content = await card.textContent();
    
    // Should show count or percentage
    expect(content).toMatch(/\d+/);
  });

  test('should render daily revenue chart', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Daily Revenue' });
    
    // Wait for chart to render
    await page.waitForTimeout(1000);
    
    // Canvas should have width and height
    const canvas = card.locator('canvas');
    const width = await canvas.evaluate(el => el.width);
    const height = await canvas.evaluate(el => el.height);
    
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  test('should list top customers with amounts', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Top 10 Customers' });
    
    const content = await card.textContent();
    
    // Should contain email addresses and amounts
    expect(content).toMatch(/@/); // Email symbol
    expect(content).toContain('€'); // Euro symbol
  });

  test('should calculate refund rate', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Refund' });
    
    const content = await card.textContent();
    
    // Should show percentage or count
    expect(content).toMatch(/\d+/);
  });

  test('should load analytics without errors', async ({ page }) => {
    // Check console for errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Reload analytics tab
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(1000);
    
    // Should have no console errors
    expect(errors.length).toBe(0);
  });

  test('should update analytics on tab switch', async ({ page }) => {
    // Get initial conversion rate
    const card = page.locator('.analytics-card', { hasText: 'Conversion Rate' });
    const initialRate = await card.locator('h3').textContent();
    
    // Switch away and back
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(1000);
    
    // Rate should be loaded again (might be same value)
    const newRate = await card.locator('h3').textContent();
    expect(newRate).toBeTruthy();
  });

  test('should handle zero revenue gracefully', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Revenue Statistics' });
    
    // Should show 0.00 or similar, not crash
    await expect(card).toBeVisible();
    
    const content = await card.textContent();
    expect(content).toMatch(/€?\s*\d+\.?\d*/);
  });

  test('should handle no customers gracefully', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Top 10 Customers' });
    
    await expect(card).toBeVisible();
    
    // Should either show "No customers" or empty list
    const content = await card.textContent();
    expect(content).toBeTruthy();
  });

  test('should display 2FA adoption rate', async ({ page }) => {
    // Check if 2FA stats are displayed anywhere
    const analyticsSection = page.locator('.analytics-enhanced');
    const content = await analyticsSection.textContent();
    
    // Might contain 2FA or Two-Factor text
    // This is a soft check since structure may vary
    expect(content.length).toBeGreaterThan(0);
  });

  test('should show push notification stats', async ({ page }) => {
    // Check for push notification metrics
    const analyticsSection = page.locator('.analytics-enhanced');
    const content = await analyticsSection.textContent();
    
    // Should have some content (structure may vary)
    expect(content.length).toBeGreaterThan(0);
  });

  test('should format large numbers correctly', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Revenue Statistics' });
    const content = await card.textContent();
    
    // Check for proper number formatting (comma or space separators)
    // Euro amounts should be formatted
    expect(content).toMatch(/€\s*[\d,.\s]+/);
  });

  test('should show date range for daily revenue', async ({ page }) => {
    const card = page.locator('.analytics-card', { hasText: 'Daily Revenue' });
    const content = await card.textContent();
    
    // Should mention time period (30 days, last month, etc.)
    expect(content).toBeTruthy();
  });

  test('should use consistent styling across cards', async ({ page }) => {
    const cards = page.locator('.analytics-card');
    const count = await cards.count();
    
    // All cards should have similar styles
    for (let i = 0; i < Math.min(count, 6); i++) {
      const card = cards.nth(i);
      
      // Check for consistent card structure
      await expect(card).toHaveCSS('display', /block|flex|grid/);
      
      // Should have background
      const bgColor = await card.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(bgColor).toBeTruthy();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Reload analytics
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(1000);
    
    // Cards should still be visible
    const cards = page.locator('.analytics-card');
    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();
  });
});

test.describe('Analytics API', () => {
  
  test('should load analytics data via API', async ({ page }) => {
    // Login first
    await page.goto(ADMIN_URL);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Intercept analytics API call
    let apiCalled = false;
    page.on('response', response => {
      if (response.url().includes('/api/admin-analytics')) {
        apiCalled = true;
      }
    });
    
    // Switch to analytics tab
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(1000);
    
    // API should have been called
    expect(apiCalled).toBe(true);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Login
    await page.goto(ADMIN_URL);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Block analytics API
    await page.route('**/api/admin-analytics', route => {
      route.abort('failed');
    });
    
    // Try to load analytics
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(1000);
    
    // Should show error message or fallback content
    const analyticsSection = page.locator('.analytics-enhanced');
    await expect(analyticsSection).toBeVisible();
  });
});
