/**
 * Auth Flow E2E Tests
 *
 * Validates:
 * 1. Authenticated user is redirected to /app
 * 2. JWT session cookie is present
 * 3. Unauthenticated user is redirected to /login
 */
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('authenticated user lands on /app dashboard', async ({ page }) => {
    // storageState is pre-loaded from global-setup via playwright.config.ts
    await page.goto('/')

    // The middleware should redirect authenticated users or serve the app
    // Navigate directly to the protected route
    await page.goto('/es/app')
    await page.waitForLoadState('networkidle')

    // Verify we are on an /app route (not redirected to /login)
    await expect(page).toHaveURL(/\/app/)
  })

  test('session cookies are present after login', async ({ page }) => {
    await page.goto('/es/app')
    await page.waitForLoadState('networkidle')

    // Supabase stores auth tokens in cookies via @supabase/ssr
    const cookies = await page.context().cookies()
    const supabaseCookies = cookies.filter(
      (c) =>
        c.name.includes('sb-') ||
        c.name.includes('supabase')
    )

    expect(supabaseCookies.length).toBeGreaterThan(0)
  })

  test.describe('Unauthenticated Redirection', () => {
    // Force a clean state for this block, bypassing playwright.config.ts global state
    test.use({ storageState: { cookies: [], origins: [] } })

    test('unauthenticated user is redirected to /login', async ({ page }) => {
      await page.goto('/es/app')
      await page.waitForLoadState('networkidle')

      // Middleware should detect no session and redirect to /login
      await expect(page).toHaveURL(/\/login/)
    })
  })
})
