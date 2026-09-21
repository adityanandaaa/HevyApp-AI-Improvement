import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    css: true,
    // tests/e2e runs under Playwright (npm run test:e2e), not Vitest.
    exclude: ['**/node_modules/**', 'tests/e2e/**'],
  },
});
