// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * CareerLens Playwright Configuration
 * Targets local Vite frontend (http://localhost:5173) and Django API (http://127.0.0.1:8000).
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'backend\\.venv\\Scripts\\python.exe backend/manage.py runserver 127.0.0.1:8000',
      url: 'http://127.0.0.1:8000/api/health/',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm --prefix frontend run dev -- --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
