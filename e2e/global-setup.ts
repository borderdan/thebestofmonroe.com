/**
 * Global Auth Setup — Runs BEFORE all test suites.
 *
 * Authenticates test users via the login page and persists their
 * browser session state to `e2e/.auth/` so that subsequent tests
 * start already authenticated.
 */
import { test as setup, expect } from '@playwright/test'
import path from 'path'

const USER_A_FILE = path.join(__dirname, '.auth', 'user-a.json')
const USER_B_FILE = path.join(__dirname, '.auth', 'user-b.json')

setup('authenticate user A', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD

  if (!email || !password) {
    throw new Error(
      'E2E_USER_EMAIL and E2E_USER_PASSWORD environment variables are required. ' +
      'Create test users in Supabase Auth dashboard first.'
    )
  }

  // Navigate to login page
  await page.goto('/es/login', { timeout: 120_000 })
  await page.waitForLoadState('networkidle')

  // Fill credentials and submit
  await page.getByLabel(/email|correo/i).fill(email)
  await page.getByLabel(/password|contraseña|clave/i).fill(password)
  await page.getByRole('button', { name: /log\s*in|iniciar|sign\s*in|entrar/i }).click()

  // Wait for redirect to the /app dashboard
  await page.waitForURL('**/app**', { timeout: 15_000 })
  await expect(page).toHaveURL(/\/app/)

  // Save auth state
  await page.context().storageState({ path: USER_A_FILE })
})

setup('authenticate user B', async ({ page }) => {
  const email = process.env.E2E_USER_B_EMAIL
  const password = process.env.E2E_USER_B_PASSWORD

  if (!email || !password) {
    console.warn(
      '⚠️  E2E_USER_B_EMAIL / E2E_USER_B_PASSWORD not set — tenant isolation tests will be skipped.'
    )
    // Still save an empty state so file exists
    await page.context().storageState({ path: USER_B_FILE })
    return
  }

  await page.goto('/es/login', { timeout: 120_000 })
  await page.waitForLoadState('networkidle')

  await page.getByLabel(/email|correo/i).fill(email)
  await page.getByLabel(/password|contraseña|clave/i).fill(password)
  await page.getByRole('button', { name: /log\s*in|iniciar|sign\s*in|entrar/i }).click()

  await page.waitForURL('**/app**', { timeout: 15_000 })
  await expect(page).toHaveURL(/\/app/)

  await page.context().storageState({ path: USER_B_FILE })
})
