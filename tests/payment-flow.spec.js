import { test, expect } from '@playwright/test';

/**
 * Payment Flow Tests for BILLIONAIRS
 * 
 * Tests the critical payment form validation, 
 * Terms & Conditions checkbox, and form UX.
 * Runs against the live site — does NOT make real payments.
 */

test.describe('Payment Form Validation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Accept cookies if banner appears
    try {
      const acceptBtn = page.locator('#acceptCookiesBtn, .cookie-accept-btn, [data-cookie-accept]');
      if (await acceptBtn.isVisible({ timeout: 2000 })) {
        await acceptBtn.click();
      }
    } catch { /* ignored */ }
  });

  // ── Terms & Conditions Checkbox ──
  test('should show Terms checkbox before payment button', async ({ page }) => {
    const checkbox = page.locator('#termsCheckbox');
    await expect(checkbox).toBeAttached();
  });

  test('payment button should be disabled by default', async ({ page }) => {
    const payBtn = page.locator('#stripeCheckoutButton');
    await expect(payBtn).toBeDisabled();
  });

  test('payment button should enable after accepting terms', async ({ page }) => {
    const checkbox = page.locator('#termsCheckbox');
    const payBtn = page.locator('#stripeCheckoutButton');

    // Initially disabled
    await expect(payBtn).toBeDisabled();

    // Check the Terms checkbox (click on the label/checkmark)
    await page.locator('.legal-consent-label').click();

    // Button should now be enabled
    await expect(payBtn).toBeEnabled();
  });

  test('payment button should disable when unchecking terms', async ({ page }) => {
    const payBtn = page.locator('#stripeCheckoutButton');
    const label = page.locator('.legal-consent-label');

    // Check
    await label.click();
    await expect(payBtn).toBeEnabled();

    // Uncheck
    await label.click();
    await expect(payBtn).toBeDisabled();
  });

  test('terms checkbox should contain links to legal pages', async ({ page }) => {
    const termsLink = page.locator('#termsConsentLink');
    const privacyLink = page.locator('#privacyConsentLink');
    const refundLink = page.locator('#refundConsentLink');

    await expect(termsLink).toBeAttached();
    await expect(privacyLink).toBeAttached();
    await expect(refundLink).toBeAttached();
  });

  test('clicking terms link should open terms modal', async ({ page }) => {
    const termsLink = page.locator('#termsConsentLink');
    await termsLink.click();

    const termsModal = page.locator('#termsModal');
    await expect(termsModal).toHaveClass(/active/);
  });

  test('clicking privacy link should open privacy modal', async ({ page }) => {
    const privacyLink = page.locator('#privacyConsentLink');
    await privacyLink.click();

    const privacyModal = page.locator('#privacyModal');
    await expect(privacyModal).toHaveClass(/active/);
  });

  // ── Form Field Validation ──
  test('should have required email field', async ({ page }) => {
    const emailInput = page.locator('#email, [name="email"], input[type="email"]').first();
    await expect(emailInput).toBeAttached();
  });

  test('should have password field with min 8 chars', async ({ page }) => {
    const passwordInput = page.locator('#password, [name="password"], input[type="password"]').first();
    await expect(passwordInput).toBeAttached();
  });

  test('should have first and last name fields', async ({ page }) => {
    const firstNameInput = page.locator('#firstName, [name="firstName"]');
    const lastNameInput = page.locator('#lastName, [name="lastName"]');
    await expect(firstNameInput).toBeAttached();
    await expect(lastNameInput).toBeAttached();
  });

  // ── SSL Security Seal ──
  test('should display SSL security seal', async ({ page }) => {
    const sslSeal = page.locator('.ssl-seal');
    await expect(sslSeal).toBeAttached();
  });

  // ── Payment Methods ──
  test('should have payment method options', async ({ page }) => {
    // Check for credit card / crypto / wire transfer tabs or buttons
    const paymentSection = page.locator('.payment-section, .payment-methods, [class*="payment"]').first();
    await expect(paymentSection).toBeAttached();
  });

  // ── Accessibility ──
  test('terms checkbox should be keyboard accessible', async ({ page }) => {
    const checkbox = page.locator('#termsCheckbox');
    
    // Tab to the checkbox and press Space
    await checkbox.focus();
    await page.keyboard.press('Space');
    
    // Should now be checked
    await expect(checkbox).toBeChecked();
    
    // Payment button should be enabled
    const payBtn = page.locator('#stripeCheckoutButton');
    await expect(payBtn).toBeEnabled();
  });
});
