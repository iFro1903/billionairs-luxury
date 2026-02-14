import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit-Tests in tests/unit/
    include: ['tests/unit/**/*.test.js'],
    
    // Timeout für async Tests (PBKDF2 braucht Zeit)
    testTimeout: 15000,
    
    // Reporter
    reporters: ['verbose'],
    
    // Coverage (optional, mit `npx vitest --coverage`)
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.js'],
      reporter: ['text', 'html'],
    },
  },
});
