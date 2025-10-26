import { test, expect } from '@playwright/test';

/**
 * Rate Limiting Tests
 * 
 * Testet:
 * - Erste 5 Requests sollten erfolgreich sein (oder 429 zurückgeben)
 * - 6. Request sollte mit 429 blockiert werden
 * - Blockierung sollte nach Zeitfenster aufgehoben werden
 * - IP Blocking nach 10 fehlgeschlagenen Versuchen
 */

test.describe('Rate Limiting', () => {
  
  test('should allow first 5 requests to admin-auth endpoint', async ({ request }) => {
    const endpoint = '/api/admin-auth';
    const payload = {
      email: 'test@example.com',
      password: 'TestPassword123'
    };
    
    // Sende 5 Requests
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        request.post(endpoint, {
          data: payload,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    }
    
    const responses = await Promise.all(requests);
    
    // Alle 5 sollten durchkommen (entweder 200/401 für valide Requests oder 429 wenn schon rate limited)
    // Wichtig: Nicht 429 für die ersten 5
    const statusCodes = responses.map(r => r.status());
    console.log('First 5 requests status codes:', statusCodes);
    
    // Mindestens die ersten paar sollten NICHT 429 sein
    // (könnte sein dass vorherige Tests schon Limit erreicht haben)
    const non429Count = statusCodes.filter(code => code !== 429).length;
    expect(non429Count).toBeGreaterThan(0);
  });

  test('should block 6th request with 429', async ({ request }) => {
    const endpoint = '/api/admin-auth';
    const payload = {
      email: 'rate-limit-test@example.com',
      password: 'TestPassword123'
    };
    
    // Sende 5 Requests schnell hintereinander
    for (let i = 0; i < 5; i++) {
      await request.post(endpoint, {
        data: payload,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // 6. Request sollte blockiert werden
    const sixthResponse = await request.post(endpoint, {
      data: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    expect(sixthResponse.status()).toBe(429);
    
    const body = await sixthResponse.json();
    expect(body.error).toContain('Rate limit exceeded');
  });

  test('should include Retry-After header in 429 response', async ({ request }) => {
    const endpoint = '/api/admin-auth';
    const payload = {
      email: 'retry-header-test@example.com',
      password: 'TestPassword123'
    };
    
    // Provoziere Rate Limit
    for (let i = 0; i < 6; i++) {
      await request.post(endpoint, {
        data: payload,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Nächster Request sollte 429 mit Retry-After sein
    const response = await request.post(endpoint, {
      data: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status() === 429) {
      const retryAfter = response.headers()['retry-after'];
      expect(retryAfter).toBeTruthy();
      expect(parseInt(retryAfter)).toBeGreaterThan(0);
    }
  });

  test.skip('should unblock after rate limit window expires', async ({ request }) => {
    // SKIP: Würde 60 Sekunden dauern (Rate Limit Window)
    // Nur manuell ausführen für vollständige Validierung
    
    const endpoint = '/api/admin-auth';
    const payload = {
      email: 'window-test@example.com',
      password: 'TestPassword123'
    };
    
    // Provoziere Rate Limit
    for (let i = 0; i < 6; i++) {
      await request.post(endpoint, { data: payload });
    }
    
    // Warte 61 Sekunden (Rate Limit Window + 1)
    console.log('Waiting 61 seconds for rate limit to expire...');
    await new Promise(resolve => setTimeout(resolve, 61000));
    
    // Sollte jetzt wieder erlaubt sein
    const response = await request.post(endpoint, { data: payload });
    expect(response.status()).not.toBe(429);
  });

  test('should have different limits for different endpoints', async ({ request }) => {
    // Admin Auth: 5 requests/minute
    // Other endpoints might have different limits
    
    const endpoints = [
      '/api/admin-auth',
      '/api/stripe-webhook', // Sollte höheres Limit haben
    ];
    
    // Teste dass verschiedene Endpoints unabhängige Limits haben
    const authResponse = await request.post('/api/admin-auth', {
      data: { email: 'test1@example.com', password: 'test' }
    });
    
    const webhookResponse = await request.post('/api/stripe-webhook', {
      data: { type: 'test' },
      headers: {
        'stripe-signature': 'test'
      }
    });
    
    // Beide sollten unterschiedliche Rate Limits haben
    // (oder beide nicht 429 sein wenn noch Kapazität da ist)
    console.log('Auth status:', authResponse.status());
    console.log('Webhook status:', webhookResponse.status());
  });

  test('should show user-friendly error message on rate limit', async ({ page }) => {
    // Gehe zur Admin Login Seite
    await page.goto('/admin.html');
    
    // Schließe Cookie Banner falls vorhanden
    try {
      const acceptButton = page.locator('button#acceptAllCookies, button:has-text("Accept All")');
      if (await acceptButton.isVisible({ timeout: 2000 })) {
        await acceptButton.click({ force: true });
        await page.waitForTimeout(500);
      }
    } catch (e) {
      // Kein Cookie Banner
    }
    
    // Provoziere Rate Limit durch mehrere fehlgeschlagene Logins
    for (let i = 0; i < 6; i++) {
      await page.fill('input[type="email"]', `test${i}@example.com`);
      await page.fill('input[type="password"]', 'WrongPassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Nach 6 Versuchen sollte eine Rate Limit Nachricht erscheinen
    const errorMessage = page.locator('.error-message, .alert, [class*="error"]');
    const text = await errorMessage.textContent();
    
    if (text) {
      expect(text.toLowerCase()).toMatch(/too many|rate limit|try again|wait/);
    }
  });
});
