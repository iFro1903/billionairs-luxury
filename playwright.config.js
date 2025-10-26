import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Billionairs Luxury App
 * 
 * Tests gegen:
 * - Lokale Entwicklung: http://localhost:3000
 * - Production: https://www.billionairs.luxury
 */

export default defineConfig({
  testDir: './tests',
  
  // Timeout für einzelne Tests
  timeout: 30 * 1000,
  
  // Expect Timeout
  expect: {
    timeout: 5000
  },
  
  // Fail fast - stoppe nach ersten Fehler
  fullyParallel: false,
  
  // Retry bei Fehler (nur in CI)
  retries: process.env.CI ? 2 : 0,
  
  // Parallele Worker
  workers: process.env.CI ? 1 : 1,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  
  // Shared settings für alle Tests
  use: {
    // Base URL - kann über CLI überschrieben werden
    baseURL: process.env.BASE_URL || 'https://www.billionairs.luxury',
    
    // Screenshot nur bei Fehler
    screenshot: 'only-on-failure',
    
    // Video nur bei Fehler
    video: 'retain-on-failure',
    
    // Trace bei Fehler (für Debugging)
    trace: 'on-first-retry',
  },

  // Test-Projekte für verschiedene Browser
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Mobile Tests (optional, auskommentiert)
    // {
    //   name: 'mobile',
    //   use: { ...devices['iPhone 13'] },
    // },
  ],

  // Dev Server - startet automatisch vor Tests
  // Auskommentiert, da wir gegen Production testen
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
