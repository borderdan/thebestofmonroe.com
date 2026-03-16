import { defineConfig, devices } from '@playwright/test'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Read environments from .env.local file
dotenv.config({ path: path.resolve(__dirname, '.env.local') })
/**
 * Playwright configuration for The Best of Monroe E2E tests.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on',
    screenshot: 'on',
  },

  projects: [
    // --- Setup: authenticate test users and save session state ---
    {
      name: 'auth-setup',
      testMatch: /global-setup\.ts/,
    },

    // --- Main test suite (uses authenticated session) ---
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, 'e2e', '.auth', 'user-a.json'),
      },
      dependencies: ['auth-setup'],
      testIgnore: /global-setup\.ts/,
    },
  ],

  webServer: {
    command: process.env.CI ? 'npx next start -H 127.0.0.1' : 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000, // 5 minutes for Next.js cold starts
  },
})
