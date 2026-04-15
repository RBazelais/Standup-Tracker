import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vitest configuration — restrict tests to project unit tests and
// exclude Playwright e2e and node_modules third-party tests.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    env: { TZ: 'UTC' },
    // Project unit tests only
    include: [
      'src/**/*.test.{ts,tsx,js,mjs,cjs}',
      'src/**/__tests__/**/*.{ts,tsx,js}',
      'shared/**/*.test.{ts,js}',
      'drizzle/**/*.test.{ts,js}',
    ],
    // Exclude Playwright e2e and third-party tests in node_modules.
    exclude: ['e2e/**', 'playwright.config.*', 'playwright.*', 'node_modules/**'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'e2e/', 'drizzle/'],
    },
  },
})
