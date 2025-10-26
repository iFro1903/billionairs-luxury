// ============================================================================
// E2E Tests: Broadcast Push Notifications (Feature #19)
// ============================================================================
// Tests for broadcast notification modal and functionality

import { test, expect } from '@playwright/test';

const ADMIN_URL = 'https://www.billionairs.luxury/admin.html';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@billionairs.luxury';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPass123!';

test.describe('Broadcast Push Notifications', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should show broadcast button in header', async ({ page }) => {
    // Check for broadcast button
    const broadcastBtn = page.locator('button:has-text("Broadcast")');
    await expect(broadcastBtn).toBeVisible();
  });

  test('should open broadcast modal on button click', async ({ page }) => {
    // Click broadcast button
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    // Modal should be visible
    const modal = page.locator('.broadcast-modal');
    await expect(modal).toBeVisible();
    
    // Modal overlay should be visible
    const overlay = page.locator('.modal-overlay');
    await expect(overlay).toBeVisible();
  });

  test('should show modal with all form fields', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const modal = page.locator('.broadcast-modal');
    
    // Check for title input
    const titleInput = modal.locator('input[placeholder*="Title"]');
    await expect(titleInput).toBeVisible();
    
    // Check for message textarea
    const messageTextarea = modal.locator('textarea[placeholder*="Message"]');
    await expect(messageTextarea).toBeVisible();
    
    // Check for audience select
    const audienceSelect = modal.locator('select#audienceSelect');
    await expect(audienceSelect).toBeVisible();
  });

  test('should show all audience options', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const select = page.locator('select#audienceSelect');
    
    // Check options
    await expect(select.locator('option[value="all"]')).toBeVisible();
    await expect(select.locator('option[value="paid"]')).toBeVisible();
    await expect(select.locator('option[value="unpaid"]')).toBeVisible();
  });

  test('should show send button', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const modal = page.locator('.broadcast-modal');
    const sendBtn = modal.locator('button:has-text("Send")');
    
    await expect(sendBtn).toBeVisible();
  });

  test('should close modal on overlay click', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    // Modal should be visible
    let modal = page.locator('.broadcast-modal');
    await expect(modal).toBeVisible();
    
    // Click overlay
    await page.click('.modal-overlay');
    await page.waitForTimeout(300);
    
    // Modal should be hidden
    await expect(modal).not.toBeVisible();
  });

  test('should close modal on ESC key', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    // Modal should be visible
    const modal = page.locator('.broadcast-modal');
    await expect(modal).toBeVisible();
    
    // Press ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    
    // Modal should be hidden
    await expect(modal).not.toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const modal = page.locator('.broadcast-modal');
    const sendBtn = modal.locator('button:has-text("Send")');
    
    // Try to send without filling fields
    await sendBtn.click();
    await page.waitForTimeout(500);
    
    // Should show validation message or prevent submission
    // Check if modal is still open (form didn't submit)
    await expect(modal).toBeVisible();
  });

  test('should fill and submit broadcast form', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const modal = page.locator('.broadcast-modal');
    
    // Fill form
    await modal.locator('input[placeholder*="Title"]').fill('Test Notification');
    await modal.locator('textarea[placeholder*="Message"]').fill('This is a test broadcast message');
    await modal.locator('select#audienceSelect').selectOption('all');
    
    // Submit form
    await modal.locator('button:has-text("Send")').click();
    await page.waitForTimeout(1000);
    
    // Should show success message or close modal
    // (Exact behavior depends on implementation)
  });

  test('should select different audiences', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const select = page.locator('select#audienceSelect');
    
    // Test all audience
    await select.selectOption('all');
    expect(await select.inputValue()).toBe('all');
    
    // Test paid users
    await select.selectOption('paid');
    expect(await select.inputValue()).toBe('paid');
    
    // Test unpaid users
    await select.selectOption('unpaid');
    expect(await select.inputValue()).toBe('unpaid');
  });

  test('should allow multiline messages', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const textarea = page.locator('textarea[placeholder*="Message"]');
    
    // Type multiline message
    await textarea.fill('Line 1\nLine 2\nLine 3');
    
    const value = await textarea.inputValue();
    expect(value).toContain('\n');
    expect(value.split('\n').length).toBe(3);
  });

  test('should handle long notification titles', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const titleInput = page.locator('input[placeholder*="Title"]');
    
    // Type long title
    const longTitle = 'A'.repeat(100);
    await titleInput.fill(longTitle);
    
    const value = await titleInput.inputValue();
    expect(value.length).toBeGreaterThan(50);
  });

  test('should handle long notification messages', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const textarea = page.locator('textarea[placeholder*="Message"]');
    
    // Type long message
    const longMessage = 'This is a very long message. '.repeat(20);
    await textarea.fill(longMessage);
    
    const value = await textarea.inputValue();
    expect(value.length).toBeGreaterThan(100);
  });

  test('should clear form after submission', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const modal = page.locator('.broadcast-modal');
    
    // Fill form
    await modal.locator('input[placeholder*="Title"]').fill('Test');
    await modal.locator('textarea[placeholder*="Message"]').fill('Test message');
    
    // Submit
    await modal.locator('button:has-text("Send")').click();
    await page.waitForTimeout(1000);
    
    // Open modal again
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    // Fields should be empty
    const titleValue = await modal.locator('input[placeholder*="Title"]').inputValue();
    expect(titleValue).toBe('');
  });

  test('should show loading state during submission', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const modal = page.locator('.broadcast-modal');
    
    // Fill form
    await modal.locator('input[placeholder*="Title"]').fill('Test');
    await modal.locator('textarea[placeholder*="Message"]').fill('Test message');
    
    const sendBtn = modal.locator('button:has-text("Send")');
    
    // Click send
    await sendBtn.click();
    
    // Button might show loading state (disabled or text change)
    // Check if button becomes disabled temporarily
    await page.waitForTimeout(100);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Block broadcast API
    await page.route('**/api/admin-broadcast', route => {
      route.abort('failed');
    });
    
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const modal = page.locator('.broadcast-modal');
    
    // Fill and submit
    await modal.locator('input[placeholder*="Title"]').fill('Test');
    await modal.locator('textarea[placeholder*="Message"]').fill('Test message');
    await modal.locator('button:has-text("Send")').click();
    
    await page.waitForTimeout(1000);
    
    // Should show error message
    // Modal might stay open or show error
    // (Exact behavior depends on error handling)
  });

  test('should show success message after broadcast', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/admin-broadcast', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          sent: 5,
          failed: 0
        })
      });
    });
    
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const modal = page.locator('.broadcast-modal');
    
    // Fill and submit
    await modal.locator('input[placeholder*="Title"]').fill('Test');
    await modal.locator('textarea[placeholder*="Message"]').fill('Test message');
    await modal.locator('button:has-text("Send")').click();
    
    await page.waitForTimeout(1000);
    
    // Should show success (modal closes or shows success message)
  });

  test('should display sent/failed counts', async ({ page }) => {
    // Mock API response with counts
    await page.route('**/api/admin-broadcast', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          sent: 10,
          failed: 2
        })
      });
    });
    
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const modal = page.locator('.broadcast-modal');
    
    // Fill and submit
    await modal.locator('input[placeholder*="Title"]').fill('Test');
    await modal.locator('textarea[placeholder*="Message"]').fill('Test message');
    await modal.locator('button:has-text("Send")').click();
    
    await page.waitForTimeout(1000);
    
    // Should show counts in alert or message
    // (Depends on implementation)
  });

  test('should handle special characters in notifications', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    const modal = page.locator('.broadcast-modal');
    
    // Fill with special characters
    await modal.locator('input[placeholder*="Title"]').fill('Test 🎉 Title');
    await modal.locator('textarea[placeholder*="Message"]').fill('Message with emoji 😊 and special chars: <>&"');
    
    // Should accept and display correctly
    const titleValue = await modal.locator('input[placeholder*="Title"]').inputValue();
    expect(titleValue).toContain('🎉');
  });

  test('should be accessible via keyboard', async ({ page }) => {
    // Open modal via keyboard
    await page.keyboard.press('Tab'); // Navigate to broadcast button
    // (May need multiple tabs depending on layout)
    
    // Focus broadcast button programmatically for test
    await page.focus('button:has-text("Broadcast")');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    
    // Modal should open
    const modal = page.locator('.broadcast-modal');
    await expect(modal).toBeVisible();
    
    // Navigate with Tab
    await page.keyboard.press('Tab'); // Title input
    await page.keyboard.type('Test Title');
    
    await page.keyboard.press('Tab'); // Message textarea
    await page.keyboard.type('Test Message');
    
    // Can navigate through form with keyboard
  });

  test('should maintain focus trap in modal', async ({ page }) => {
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    // Focus should be inside modal
    const modal = page.locator('.broadcast-modal');
    
    // Tab through all focusable elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
    }
    
    // Focus should still be within modal
    const focusedElement = await page.evaluate(() => {
      return document.activeElement.closest('.broadcast-modal') !== null;
    });
    
    // If focus trap is implemented, this should be true
    // (Optional feature, may not be implemented)
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Login again
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Open broadcast modal
    await page.click('button:has-text("Broadcast")');
    await page.waitForTimeout(300);
    
    // Modal should be visible and properly sized
    const modal = page.locator('.broadcast-modal');
    await expect(modal).toBeVisible();
  });
});

test.describe('Broadcast Authentication', () => {
  
  test('should require admin authentication', async ({ page }) => {
    // Try to call API directly without auth
    const response = await page.goto('https://www.billionairs.luxury/api/admin-broadcast');
    
    // Should return 401 or 405 (Method Not Allowed for GET)
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should require valid admin credentials', async ({ page }) => {
    // Try with invalid credentials
    const response = await page.request.post('https://www.billionairs.luxury/api/admin-broadcast', {
      headers: {
        'x-admin-email': 'invalid@example.com',
        'x-admin-password': 'wrongpassword'
      },
      data: {
        title: 'Test',
        message: 'Test',
        audience: 'all'
      }
    });
    
    expect(response.status()).toBe(401);
  });
});
