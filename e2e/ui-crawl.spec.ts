/**
 * UI Crawl — Automated Route Discovery & Component Inventory
 *
 * This Playwright test systematically visits every known route in the
 * The Best of Monroe application, captures screenshots, and extracts an inventory
 * of all interactive UI elements (buttons, links, inputs, selects,
 * modals, tabs, tables, error messages).
 *
 * Output:
 *   - docs/ui-crawl-results.json  (structured inventory)
 *   - e2e/screenshots/            (full-page screenshots)
 *
 * Run:
 *   npx playwright test e2e/ui-crawl.spec.ts --project=chromium
 */
import { test } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// ── Route Registry ─────────────────────────────────────────────────
// Every known page route in the app, grouped by access level.

const LOCALE = 'es'

const PUBLIC_ROUTES = [
  `/${LOCALE}/login`,
  `/${LOCALE}/pricing`,
  `/${LOCALE}/forgot-password`,
  `/${LOCALE}/b2b`,
  `/${LOCALE}/directory`,
]

const AUTH_ROUTES = [
  `/${LOCALE}/app`,
  `/${LOCALE}/app/pos`,
  `/${LOCALE}/app/pos/unlock`,
  `/${LOCALE}/app/pos/gift-cards`,
  `/${LOCALE}/app/crm`,
  `/${LOCALE}/app/inventory`,
  `/${LOCALE}/app/eforms`,
  `/${LOCALE}/app/eforms/create`,
  `/${LOCALE}/app/vault`,
  `/${LOCALE}/app/directory`,
  `/${LOCALE}/app/links`,
  `/${LOCALE}/app/links/analytics`,
  `/${LOCALE}/app/keyrings`,
  `/${LOCALE}/app/users`,
  `/${LOCALE}/app/users/audit-logs`,
  `/${LOCALE}/app/invoices`,
  `/${LOCALE}/app/automations`,
  `/${LOCALE}/app/theme`,
  `/${LOCALE}/app/settings`,
  `/${LOCALE}/app/settings/billing`,
  `/${LOCALE}/app/settings/subscription`,
  `/${LOCALE}/app/upgrade`,
]

const ADMIN_ROUTES = [
  `/${LOCALE}/admin`,
  `/${LOCALE}/admin/tenants`,
]

const EXTERNAL_ROUTES = [
  `/${LOCALE}/checkout/success`,
  `/${LOCALE}/checkout/pending`,
  `/${LOCALE}/checkout/failure`,
  `/${LOCALE}/claim`,
  `/${LOCALE}/portal/login`,
]

// ── Types ──────────────────────────────────────────────────────────

interface ElementInfo {
  text: string
  selector: string
  disabled?: boolean
  href?: string
  type?: string
  name?: string
  placeholder?: string
  required?: boolean
  target?: string
  role?: string
}

interface PageAudit {
  route: string
  timestamp: string
  status: 'loaded' | 'error' | 'redirect' | 'timeout'
  finalUrl: string
  pageTitle: string
  screenshot: string
  consoleErrors: string[]
  elements: {
    buttons: ElementInfo[]
    links: ElementInfo[]
    inputs: ElementInfo[]
    selects: ElementInfo[]
    textareas: ElementInfo[]
    modals: ElementInfo[]
    tabs: ElementInfo[]
    tables: { selector: string; rows: number; columns: number }[]
    images: { src: string; alt: string; broken: boolean }[]
    errors: string[]
  }
  metrics: {
    totalInteractive: number
    totalButtons: number
    totalLinks: number
    totalInputs: number
    disabledButtons: number
    brokenImages: number
    consoleErrorCount: number
    visibleErrorCount: number
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots')
const RESULTS_FILE = path.join(__dirname, '..', 'docs', 'ui-crawl-results.json')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function slugify(route: string): string {
  return route.replace(/^\//, '').replace(/\//g, '--').replace(/[^a-zA-Z0-9-]/g, '_') || 'root'
}

// ── Extraction Logic ────────────────────────────────────────────────

async function extractPageElements(page: import('@playwright/test').Page): Promise<PageAudit['elements']> {
  return page.evaluate(() => {
    function getSelector(el: Element): string {
      if (el.id) return `#${el.id}`
      if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`
      if (el.getAttribute('name')) return `[name="${el.getAttribute('name')}"]`
      const tag = el.tagName.toLowerCase()
      const cls = el.className?.toString().split(' ').filter(Boolean).slice(0, 2).join('.')
      return cls ? `${tag}.${cls}` : tag
    }

    // Buttons
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]')).map(el => ({
      text: (el as HTMLElement).innerText?.trim().slice(0, 100) || el.getAttribute('aria-label') || '',
      selector: getSelector(el),
      disabled: (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true',
      role: el.getAttribute('role') || el.tagName.toLowerCase(),
    }))

    // Links
    const links = Array.from(document.querySelectorAll('a[href]')).map(el => ({
      text: (el as HTMLElement).innerText?.trim().slice(0, 100) || el.getAttribute('aria-label') || '',
      selector: getSelector(el),
      href: (el as HTMLAnchorElement).href,
      target: (el as HTMLAnchorElement).target || undefined,
    }))

    // Inputs
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])')).map(el => {
      const input = el as HTMLInputElement
      return {
        text: el.getAttribute('aria-label') || '',
        selector: getSelector(el),
        type: input.type,
        name: input.name,
        placeholder: input.placeholder,
        required: input.required,
      }
    })

    // Selects
    const selects = Array.from(document.querySelectorAll('select, [role="combobox"], [role="listbox"]')).map(el => ({
      text: el.getAttribute('aria-label') || (el as HTMLElement).innerText?.trim().slice(0, 50) || '',
      selector: getSelector(el),
      role: el.getAttribute('role') || 'select',
    }))

    // Textareas
    const textareas = Array.from(document.querySelectorAll('textarea')).map(el => {
      const ta = el as HTMLTextAreaElement
      return {
        text: el.getAttribute('aria-label') || '',
        selector: getSelector(el),
        name: ta.name,
        placeholder: ta.placeholder,
        required: ta.required,
      }
    })

    // Modals/Dialogs
    const modals = Array.from(document.querySelectorAll('dialog, [role="dialog"], [role="alertdialog"], [data-state="open"]')).map(el => ({
      text: (el as HTMLElement).innerText?.trim().slice(0, 100) || '',
      selector: getSelector(el),
      role: el.getAttribute('role') || el.tagName.toLowerCase(),
    }))

    // Tabs
    const tabs = Array.from(document.querySelectorAll('[role="tab"], [role="tablist"]')).map(el => ({
      text: (el as HTMLElement).innerText?.trim().slice(0, 100) || '',
      selector: getSelector(el),
      role: el.getAttribute('role') || '',
    }))

    // Tables
    const tables = Array.from(document.querySelectorAll('table, [role="grid"], [role="table"]')).map(el => ({
      selector: getSelector(el),
      rows: el.querySelectorAll('tr, [role="row"]').length,
      columns: el.querySelector('tr, [role="row"]')?.children.length || 0,
    }))

    // Images
    const images = Array.from(document.querySelectorAll('img')).map(el => {
      const img = el as HTMLImageElement
      return {
        src: img.src,
        alt: img.alt,
        broken: !img.complete || img.naturalWidth === 0,
      }
    })

    // Visible error messages
    const errorSelectors = [
      '[class*="error" i]',
      '[class*="alert" i]',
      '[role="alert"]',
      '[data-error]',
    ]
    const errors: string[] = []
    for (const sel of errorSelectors) {
      document.querySelectorAll(sel).forEach(el => {
        const text = (el as HTMLElement).innerText?.trim()
        if (text && text.length > 0 && text.length < 500) {
          errors.push(text)
        }
      })
    }

    return { buttons, links, inputs, selects, textareas, modals, tabs, tables, images, errors }
  })
}

// ── Test Suite ──────────────────────────────────────────────────────

test.describe('UI Crawl — Full Route Inventory', () => {
  // Run tests sequentially to avoid overwriting the results file from multiple workers
  test.describe.configure({ mode: 'serial' })
  // Increase timeout to 5 minutes to allow crawling all pages
  test.setTimeout(300_000)

  const results: PageAudit[] = []

  async function crawlRoute(page: import('@playwright/test').Page, route: string) {
    const consoleErrors: string[] = []

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text().slice(0, 200))
      }
    })

    const slug = slugify(route)
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${slug}.png`)

    let status: PageAudit['status'] = 'loaded'
    let finalUrl = ''
    let pageTitle = ''

    try {
      const response = await page.goto(route, { timeout: 30_000, waitUntil: 'networkidle' })

      if (!response) {
        status = 'error'
      } else if (response.status() >= 400) {
        status = 'error'
      }

      finalUrl = page.url()
      if (finalUrl !== new URL(route, page.url()).href) {
        status = 'redirect'
      }

      pageTitle = await page.title()

      // Wait a moment for dynamic content
      await page.waitForTimeout(1000)

      // Screenshot
      await page.screenshot({ path: screenshotPath, fullPage: true })

    } catch {
      status = 'timeout'
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true })
      } catch {
        // ignore screenshot failure
      }
    }

    // Extract elements
    let elements: PageAudit['elements'] = {
      buttons: [], links: [], inputs: [], selects: [],
      textareas: [], modals: [], tabs: [], tables: [],
      images: [], errors: [],
    }

    try {
      elements = await extractPageElements(page)
    } catch {
      // page may have navigated away
    }

    const audit: PageAudit = {
      route,
      timestamp: new Date().toISOString(),
      status,
      finalUrl,
      pageTitle,
      screenshot: `e2e/screenshots/${slug}.png`,
      consoleErrors,
      elements,
      metrics: {
        totalInteractive: elements.buttons.length + elements.links.length + elements.inputs.length + elements.selects.length,
        totalButtons: elements.buttons.length,
        totalLinks: elements.links.length,
        totalInputs: elements.inputs.length,
        disabledButtons: elements.buttons.filter(b => b.disabled).length,
        brokenImages: elements.images.filter(i => i.broken).length,
        consoleErrorCount: consoleErrors.length,
        visibleErrorCount: elements.errors.length,
      },
    }

    results.push(audit)
    return audit
  }

  test.beforeAll(() => {
    ensureDir(SCREENSHOTS_DIR)
    ensureDir(path.dirname(RESULTS_FILE))
  })

  test('crawl public routes', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    for (const route of PUBLIC_ROUTES) {
      await crawlRoute(page, route)
    }

    await context.close()
  })

  test('crawl authenticated app routes', async ({ browser }) => {
    // Load the authenticated session
    const authFile = path.join(__dirname, '.auth', 'user-a.json')
    if (!fs.existsSync(authFile)) {
      test.skip()
      return
    }

    const context = await browser.newContext({
      storageState: authFile,
    })
    const page = await context.newPage()

    for (const route of AUTH_ROUTES) {
      await crawlRoute(page, route)
    }

    await context.close()
  })

  test('crawl admin routes', async ({ browser }) => {
    const authFile = path.join(__dirname, '.auth', 'user-a.json')
    if (!fs.existsSync(authFile)) {
      test.skip()
      return
    }

    const context = await browser.newContext({
      storageState: authFile,
    })
    const page = await context.newPage()

    for (const route of ADMIN_ROUTES) {
      await crawlRoute(page, route)
    }

    await context.close()
  })

  test('crawl external-facing routes', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    for (const route of EXTERNAL_ROUTES) {
      await crawlRoute(page, route)
    }

    await context.close()
  })

  test.afterAll(() => {
    // Write combined results
    ensureDir(path.dirname(RESULTS_FILE))
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2), 'utf-8')

    // Print summary to console
    const loaded = results.filter(r => r.status === 'loaded').length
    const redirected = results.filter(r => r.status === 'redirect').length
    const errored = results.filter(r => r.status === 'error').length
    const timedOut = results.filter(r => r.status === 'timeout').length

    console.log('\n' + '='.repeat(60))
    console.log('  UI CRAWL SUMMARY')
    console.log('='.repeat(60))
    console.log(`  Total routes:    ${results.length}`)
    console.log(`  ✅ Loaded:       ${loaded}`)
    console.log(`  ↪️  Redirected:   ${redirected}`)
    console.log(`  ❌ Errors:       ${errored}`)
    console.log(`  ⏱️  Timeouts:     ${timedOut}`)
    console.log('='.repeat(60))

    const totalButtons = results.reduce((sum, r) => sum + r.metrics.totalButtons, 0)
    const totalLinks = results.reduce((sum, r) => sum + r.metrics.totalLinks, 0)
    const totalInputs = results.reduce((sum, r) => sum + r.metrics.totalInputs, 0)
    const totalDisabled = results.reduce((sum, r) => sum + r.metrics.disabledButtons, 0)
    const totalBrokenImgs = results.reduce((sum, r) => sum + r.metrics.brokenImages, 0)
    const totalConsoleErrs = results.reduce((sum, r) => sum + r.metrics.consoleErrorCount, 0)

    console.log(`  Total buttons:          ${totalButtons} (${totalDisabled} disabled)`)
    console.log(`  Total links:            ${totalLinks}`)
    console.log(`  Total inputs:           ${totalInputs}`)
    console.log(`  Broken images:          ${totalBrokenImgs}`)
    console.log(`  Console errors:         ${totalConsoleErrs}`)
    console.log('='.repeat(60))
    console.log(`\n  Results saved to: ${RESULTS_FILE}`)
    console.log(`  Screenshots in:  ${SCREENSHOTS_DIR}`)
  })
})
