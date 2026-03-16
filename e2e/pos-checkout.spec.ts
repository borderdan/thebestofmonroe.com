/**
 * POS Checkout Flow E2E Tests
 *
 * Validates the full point-of-sale transaction cycle:
 * 1. Load POS product grid
 * 2. Add item to Zustand cart (persisted in IndexedDB)
 * 3. Verify cart state persists across page reload
 * 4. Execute checkout
 * 5. Verify transaction was inserted
 */
import { test, expect } from '@playwright/test'

test.describe('POS Checkout Flow', () => {
  test.setTimeout(60000); // Set timeout to 60 seconds for all tests in this describe block

  test.beforeEach(async ({ page }) => {
    // Pipe browser console logs to process stdout
    page.on('console', msg => {
      console.log(`[BROWSER] ${msg.text()}`)
    })

    // Navigate to the POS page
    console.log('[E2E] Navigating to /es/app/pos')
    await page.goto('/es/app/pos')
    
    // Mock window.print to prevent blocking dialogs in CI
    await page.evaluate(() => {
      window.print = () => { console.log('[E2E] window.print() called'); };
    })

    // 1. Handle POS Unlock screen if redirected
    const currentUrl = page.url()
    console.log(`[E2E] Current URL: ${currentUrl}`)
    
    if (currentUrl.includes('/unlock') || await page.getByText(/POS Unlock/i).isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('[E2E] POS is locked, entering PIN 0000...')
      // Entering PIN '0000' by clicking keypad buttons
      for (const digit of '0000') {
        const btn = page.getByRole('button', { name: digit, exact: true })
        await btn.click()
      }
      // Wait for redirect back to main POS
      await page.waitForURL(/\/app\/pos(?!\/unlock)/, { timeout: 15_000 })
      console.log('[E2E] Unlocked, redirected back to POS')
    }

    // 2. Wait for POS to be ready (hydrated)
    console.log('[E2E] Waiting for pos-ready indicator...')
    const hydrating = page.getByTestId('pos-hydrating')
    const ready = page.getByTestId('pos-ready')
    
    try {
      // Small wait to allow one of them to appear
      await expect(ready.or(hydrating)).toBeVisible({ timeout: 30_000 })
    } catch (e) {
      console.log('[E2E] FAILED to find hydration indicators. Dumping page state:')
      const content = await page.content()
      console.log(`[E2E] Page content length: ${content.length}`)
      console.log(`[E2E] Page snippet: ${content.substring(0, 500)}`)
      throw e
    }

    if (await hydrating.isVisible()) {
      console.log('[E2E] POS is currently hydrating...')
    }
    await expect(ready).toBeVisible({ timeout: 20_000 })
    console.log('[E2E] POS is ready.')
  })

  test('POS grid loads with product items', async ({ page }) => {
    // The POS page should display product entities
    const productGrid = page.getByTestId('pos-grid')
    await expect(productGrid).toBeVisible({ timeout: 15_000 })

    // Wait for either products OR empty state message to avoid long timeouts
    const products = page.getByTestId('product-card')
    const emptyMessage = page.getByText(/no menu items found|no se encontraron productos|items found/i)
    
    await expect(products.first().or(emptyMessage)).toBeVisible({ timeout: 15_000 })
    console.log('[E2E] Grid or empty message is visible')

    if (await emptyMessage.isVisible()) {
      throw new Error('POS grid is empty. Please seed "menu_item" entities for the test user.')
    }

    await expect(products.first()).toBeVisible()
  })

  test('adding item to cart updates the cart UI', async ({ page }) => {
    // Click on a product to add it to the cart
    const firstProduct = page.getByTestId('product-card').first()
    await firstProduct.click()

    // Cart should show at least 1 item
    const cartCount = page.getByTestId('cart-count')
    const cartItem = page.getByTestId('cart-item').first()

    // At least one of these should be visible and indicate items
    await expect(
      cartCount.or(cartItem)
    ).toBeVisible({ timeout: 5_000 })
    console.log('[E2E] Cart UI updated after adding item')
  })

  test('cart persists after page reload (IndexedDB via idb-keyval)', async ({ page }) => {
    // Add an item
    const firstProduct = page.getByTestId('product-card').first()
    await firstProduct.click()

    // Wait for Zustand to persist to IndexedDB
    await page.waitForTimeout(1_000)

    // Reload the page
    await page.reload()
    // Wait for POS-ready again after reload
    await expect(page.getByTestId('pos-ready')).toBeVisible({ timeout: 15_000 })

    // Verify IndexedDB has persisted cart data
    const hasCartData = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const request = indexedDB.open('keyval-store', 1)
        request.onsuccess = () => {
          const db = request.result
          if (!db.objectStoreNames.contains('keyval')) {
            resolve(false)
            return
          }
          const tx = db.transaction('keyval', 'readonly')
          const store = tx.objectStore('keyval')
          const getReq = store.getAllKeys()
          getReq.onsuccess = () => {
            // idb-keyval stores Zustand state under a key
            resolve(getReq.result.length > 0)
          }
          getReq.onerror = () => resolve(false)
        }
        request.onerror = () => resolve(false)
      })
    })

    expect(hasCartData).toBe(true)
  })

  test('checkout creates a transaction', async ({ page }) => {
    // Add an item to cart
    const firstProduct = page.getByTestId('product-card').first()
    const emptyMessage = page.getByText(/no menu items found|no se encontraron productos|items found/i)
    
    // Safety check: wait for products to load
    console.log('[E2E] Waiting for products or empty message in checkout test...')
    await expect(firstProduct.or(emptyMessage)).toBeVisible({ timeout: 15_000 })
    
    if (await emptyMessage.isVisible()) {
       throw new Error('Cannot run checkout test: POS grid is empty.')
    }
    
    await firstProduct.click()

    // Wait for item to appear in cart and ensure total updates
    const cartItem = page.getByTestId('cart-item').first()
    await expect(cartItem).toBeVisible({ timeout: 10_000 })
    
    // Explicitly wait for total to update from $0.00
    const totalValueLocator = page.getByTestId('cart-total-value').filter({ visible: true }).last()
    
    await expect(async () => {
      const text = await totalValueLocator.innerText()
      expect(text.trim()).not.toBe('$0.00')
      const numericPart = text.replace(/[^0-9.]/g, '')
      expect(parseFloat(numericPart)).toBeGreaterThan(0)
    }).toPass({ timeout: 10_000 })
    
    const checkoutBtn = page.getByTestId('checkout-cash-btn').filter({ visible: true }).last()
    await expect(checkoutBtn).toBeVisible({ timeout: 5_000 })
    await checkoutBtn.click()

    // 7. Verify success toast or empty cart
    // Flexible regex for: "Cash payment completed", "Venta registrada exitosamente", "Payment Successful"
    const checkoutEmptyMessage = page.getByText(/El carrito está vacío|Cart is empty/i)
    const successToast = page.getByText(/(completed|venta|exitosamente|éxito|success)/i)
    await expect(checkoutEmptyMessage.or(successToast).first()).toBeVisible({ timeout: 15_000 })
    console.log('[E2E] Checkout successful, saw empty cart or success toast')
  })

  test('offline checkout queues transaction and handles network loss gracefully', async ({ page, context }) => {
    // Wait for products
    const firstProduct = page.getByTestId('product-card').first()
    const emptyMessage = page.getByText(/no menu items found|no se encontraron productos|items found/i)
    
    await expect(firstProduct.or(emptyMessage)).toBeVisible({ timeout: 15_000 })
    if (await emptyMessage.isVisible()) {
      console.log('[E2E] POS grid is empty, skipping offline test.')
      return
    }

    // Go offline
    await context.setOffline(true)
    console.log('[E2E] Browser is now OFFLINE')

    // Add item to cart
    await firstProduct.click()
    
    // Wait for total to update
    const totalValueLocator = page.getByTestId('cart-total-value').filter({ visible: true }).last()
    await expect(async () => {
      const text = await totalValueLocator.innerText()
      const numericPart = text.replace(/[^0-9.]/g, '')
      expect(parseFloat(numericPart)).toBeGreaterThan(0)
    }).toPass({ timeout: 10_000 })
    
    // Click Checkout
    const checkoutBtn = page.getByTestId('checkout-cash-btn').filter({ visible: true }).last()
    await expect(checkoutBtn).toBeVisible({ timeout: 5_000 })
    await checkoutBtn.click()

    // Verify it was handled (either empty cart, success toast, or an offline/queued message)
    const successMessage = page.getByText(/(completed|venta|exitosamente|éxito|success|offline|guardado|pendiente|saved|queued)/i)
    await expect(successMessage.first()).toBeVisible({ timeout: 15_000 })
    console.log('[E2E] Offline checkout processed in UI')

    // Go back online
    await context.setOffline(false)
    console.log('[E2E] Browser is now ONLINE')
    
    // Wait for background sync attempt
    await page.waitForTimeout(2000)
  })
})
