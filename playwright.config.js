import { defineConfig } from '@playwright/test'

// Always runs Playwright's own Chromium, headless, so local runs and CI behave the same.
// One-time setup on a machine: `npx playwright install chromium`.
// @playwright/test is pinned to 1.60.0 (exact version) because newer releases no longer
// support macOS 13, which the local dev machine runs; 1.60 still works everywhere, CI included.
// Raise the pin when the dev machine is upgraded.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
  // test the production build, not the dev server
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
