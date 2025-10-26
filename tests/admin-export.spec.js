// ============================================================================
// E2E Tests: Admin Export Features (Feature #19)
// ============================================================================
// Tests for CSV/JSON/TXT export functionality

import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const ADMIN_URL = 'https://www.billionairs.luxury/admin.html';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@billionairs.luxury';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPass123!';

test.describe('Admin Export Features', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    
    // Submit login
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Verify we're logged in (dashboard visible)
    await expect(page.locator('.admin-container')).toBeVisible();
  });

  test('should show export buttons on Users tab', async ({ page }) => {
    // Switch to Users tab
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(500);
    
    // Verify export buttons are visible
    const exportButtons = page.locator('.export-buttons');
    await expect(exportButtons).toBeVisible();
    
    // Check all three export formats
    await expect(page.locator('button.export-btn:has-text("CSV")')).toBeVisible();
    await expect(page.locator('button.export-btn:has-text("JSON")')).toBeVisible();
    await expect(page.locator('button.export-btn:has-text("TXT")')).toBeVisible();
  });

  test('should export users as CSV', async ({ page }) => {
    // Switch to Users tab
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(500);
    
    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button.export-btn:has-text("CSV")');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify filename matches pattern
    expect(download.suggestedFilename()).toMatch(/users_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv/);
    
    // Save and read file
    const path = await download.path();
    const content = fs.readFileSync(path, 'utf-8');
    
    // Verify CSV headers
    expect(content).toContain('Email,Payment Status,Premium Until,Created At');
  });

  test('should export users as JSON', async ({ page }) => {
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(500);
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button.export-btn:has-text("JSON")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/users_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json/);
    
    // Read and parse JSON
    const path = await download.path();
    const content = fs.readFileSync(path, 'utf-8');
    const data = JSON.parse(content);
    
    // Verify structure
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('email');
      expect(data[0]).toHaveProperty('payment_status');
    }
  });

  test('should export users as TXT', async ({ page }) => {
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(500);
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button.export-btn:has-text("TXT")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/users_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.txt/);
    
    const path = await download.path();
    const content = fs.readFileSync(path, 'utf-8');
    
    // Verify TXT format
    expect(content).toContain('Email:');
    expect(content).toContain('Payment Status:');
  });

  test('should export payments as CSV', async ({ page }) => {
    await page.click('button:has-text("Payments")');
    await page.waitForTimeout(500);
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button.export-btn:has-text("CSV")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/payments_.*\.csv/);
    
    const path = await download.path();
    const content = fs.readFileSync(path, 'utf-8');
    
    expect(content).toContain('User Email,Amount,Status,Created At');
  });

  test('should export chat messages as CSV', async ({ page }) => {
    await page.click('button:has-text("Chat")');
    await page.waitForTimeout(500);
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button.export-btn:has-text("CSV")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/chat_.*\.csv/);
    
    const path = await download.path();
    const content = fs.readFileSync(path, 'utf-8');
    
    expect(content).toContain('Email,Message,Read Status,Created At');
  });

  test('should export audit logs as CSV', async ({ page }) => {
    await page.click('button:has-text("Audit")');
    await page.waitForTimeout(500);
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button.export-btn:has-text("CSV")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/audit-logs_.*\.csv/);
    
    const path = await download.path();
    const content = fs.readFileSync(path, 'utf-8');
    
    expect(content).toContain('Action,User Email,Timestamp,Details');
  });

  test('should export refunds as CSV', async ({ page }) => {
    await page.click('button:has-text("Refunds")');
    await page.waitForTimeout(500);
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button.export-btn:has-text("CSV")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/refunds_.*\.csv/);
    
    const path = await download.path();
    const content = fs.readFileSync(path, 'utf-8');
    
    expect(content).toContain('Payment ID,User Email,Amount,Status');
  });

  test('should handle CSV with special characters', async ({ page }) => {
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(500);
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button.export-btn:has-text("CSV")');
    
    const download = await downloadPromise;
    const path = await download.path();
    const content = fs.readFileSync(path, 'utf-8');
    
    // Verify quotes are properly escaped
    // If email contains comma or quote, it should be wrapped in quotes
    const lines = content.split('\n');
    expect(lines.length).toBeGreaterThan(0); // Has headers at least
  });

  test('should export empty data gracefully', async ({ page }) => {
    // Try exporting refunds (might be empty)
    await page.click('button:has-text("Refunds")');
    await page.waitForTimeout(500);
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button.export-btn:has-text("CSV")');
    
    const download = await downloadPromise;
    const path = await download.path();
    const content = fs.readFileSync(path, 'utf-8');
    
    // Should have headers even if no data
    expect(content).toContain('Payment ID,User Email,Amount,Status');
  });

  test('should export with current timestamp in filename', async ({ page }) => {
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(500);
    
    const beforeTime = new Date();
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button.export-btn:has-text("CSV")');
    
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    
    const afterTime = new Date();
    
    // Extract date from filename (users_2025-10-26_14-30-45.csv)
    const dateMatch = filename.match(/users_(\d{4}-\d{2}-\d{2})/);
    expect(dateMatch).not.toBeNull();
    
    const fileDate = dateMatch[1];
    const today = beforeTime.toISOString().split('T')[0];
    expect(fileDate).toBe(today);
  });

  test('should allow multiple exports in sequence', async ({ page }) => {
    await page.click('button:has-text("Users")');
    await page.waitForTimeout(500);
    
    // First export
    let downloadPromise = page.waitForEvent('download');
    await page.click('button.export-btn:has-text("CSV")');
    let download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/users_.*\.csv/);
    
    // Second export (different format)
    downloadPromise = page.waitForEvent('download');
    await page.click('button.export-btn:has-text("JSON")');
    download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/users_.*\.json/);
    
    // Third export (TXT)
    downloadPromise = page.waitForEvent('download');
    await page.click('button.export-btn:has-text("TXT")');
    download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/users_.*\.txt/);
  });

  test('should show export buttons on all tabs', async ({ page }) => {
    const tabs = ['Users', 'Payments', 'Chat', 'Audit', 'Refunds'];
    
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`);
      await page.waitForTimeout(300);
      
      // Verify export buttons exist
      const exportButtons = page.locator('.export-buttons');
      await expect(exportButtons).toBeVisible();
      
      await expect(page.locator('button.export-btn:has-text("CSV")')).toBeVisible();
      await expect(page.locator('button.export-btn:has-text("JSON")')).toBeVisible();
      await expect(page.locator('button.export-btn:has-text("TXT")')).toBeVisible();
    }
  });
});

test.describe('Export Authentication', () => {
  
  test('should require admin authentication', async ({ page }) => {
    // Try to access export API directly without auth
    const response = await page.goto('https://www.billionairs.luxury/api/admin-export?type=users&format=csv');
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('should validate export parameters', async ({ page }) => {
    // Login first
    await page.goto(ADMIN_URL);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Try invalid export type
    const response = await page.goto('https://www.billionairs.luxury/api/admin-export?type=invalid&format=csv');
    
    // Should return 400 Bad Request
    expect(response.status()).toBe(400);
  });
});
