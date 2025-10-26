# Playwright Testing Suite

Automatisierte End-to-End Tests für die Billionairs Luxury App mit Playwright.

## 📦 Installation

```bash
npm install
npx playwright install chromium
```

## 🚀 Tests Ausführen

### Alle Tests (Headless)
```bash
npm test
```

### Tests mit Browser (Headed Mode)
```bash
npm run test:headed
```

### Debug Mode (Step-by-Step)
```bash
npm run test:debug
```

### UI Mode (Interaktiv)
```bash
npm run test:ui
```

### Test Report Anzeigen
```bash
npm run test:report
```

## 📝 Test Suites

### 1. Homepage Tests (`tests/homepage.spec.js`)
- ✅ Seite lädt erfolgreich
- ✅ Cookie Consent Banner funktioniert
- ✅ SEO Meta Tags vorhanden
- ✅ PWA Manifest valide
- ✅ Google Analytics installiert
- ✅ Security Headers korrekt
- ✅ Performance (< 3 Sekunden)
- ✅ Mobile Responsive

### 2. Admin Login Tests (`tests/admin-login.spec.js`)
- ✅ Login Page lädt korrekt
- ✅ Form Validierung funktioniert
- ✅ Security Headers (X-Frame-Options, CSP)
- ✅ Iframe Embedding blockiert
- ⏭️ Login mit falschen Credentials (SKIP)
- ⏭️ Login mit korrekten Credentials (SKIP)

**Hinweis:** Echte Login-Tests sind deaktiviert (`.skip()`), um Production Credentials nicht zu gefährden. Aktiviere sie nur für lokale Tests mit `TEST_ADMIN_EMAIL` und `TEST_ADMIN_PASSWORD` Environment Variables.

### 3. Rate Limiting Tests (`tests/rate-limiting.spec.js`)
- ✅ Erste 5 Requests erlaubt
- ✅ 6. Request wird mit 429 blockiert
- ✅ Retry-After Header vorhanden
- ✅ User-friendly Error Message
- ⏭️ Rate Limit Window Expiration (SKIP - 60s)

## 🎯 Gegen Production Testen

```bash
BASE_URL=https://www.billionairs.luxury npm test
```

**Wichtig:** Rate Limiting Tests sollten NICHT gegen Production ausgeführt werden, da sie absichtlich viele Requests senden.

## 🔧 Test Konfiguration

Die Tests sind in `playwright.config.js` konfiguriert:
- **Timeout:** 30 Sekunden pro Test
- **Retries:** 0 lokal, 2 in CI
- **Screenshots:** Nur bei Fehler
- **Video:** Nur bei Fehler
- **Trace:** Bei erstem Retry (für Debugging)

## 📊 Test Reports

Nach dem Ausführen wird automatisch ein HTML Report generiert:
```bash
npx playwright show-report
```

## ⚠️ Wichtige Hinweise

### Rate Limiting
- Rate Limiting Tests senden viele Requests und können temporär blockiert werden
- Warte 60 Sekunden zwischen Test-Durchläufen
- NICHT gegen Production ausführen

### Credentials
- Login Tests sind standardmäßig deaktiviert (`.skip()`)
- Aktiviere sie nur mit Test-Environment Variables:
  ```bash
  TEST_ADMIN_EMAIL=test@example.com TEST_ADMIN_PASSWORD=test npm test
  ```

### CI/CD Integration
- Tests können in GitHub Actions integriert werden
- Verwende `process.env.CI` für CI-spezifische Konfiguration
- Playwright installiert automatisch Browser in CI

## 🐛 Debugging

### Failed Test Screenshot
Screenshots von fehlgeschlagenen Tests findest du in:
```
test-results/
```

### Trace Viewer
Bei Fehlern wird ein Trace aufgezeichnet:
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Console Logs
Tests loggen wichtige Informationen:
```javascript
console.log('Performance metrics:', performanceMetrics);
```

## 📈 Erweitern

### Neuen Test hinzufügen
```javascript
// tests/my-feature.spec.js
import { test, expect } from '@playwright/test';

test('my feature works', async ({ page }) => {
  await page.goto('/my-feature');
  await expect(page.locator('h1')).toContainText('My Feature');
});
```

### Test in bestehende Suite einfügen
```javascript
test.describe('My Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-feature');
  });

  test('test 1', async ({ page }) => {
    // ...
  });
});
```

## 🔗 Ressourcen

- [Playwright Dokumentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selector Best Practices](https://playwright.dev/docs/selectors)
