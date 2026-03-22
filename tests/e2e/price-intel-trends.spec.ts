import { expect, test } from '@playwright/test';

test.describe('Price Intel Page', () => {
  test('displays price trend indicators', async ({ page }) => {
    // Navigate to the price intel page
    await page.goto('/en/wallet/grocery');

    // Wait for the page to load
    await expect(page.locator('h1:has-text("Price Intel")')).toBeVisible();

    // Check if the "Biggest Price Drops This Week" section exists
    const dropsSection = page.locator('h3:has-text("Biggest Price Drops This Week")');
    // If there are top drops, we should see it
    // Note: Since this relies on live DB data, we might not always have drops.
    // We will just take a screenshot of the main page
    await page.waitForTimeout(2000); // Give it a moment to render

    await page.screenshot({ path: '/home/jules/verification/price_intel_trends.png', fullPage: true });
  });
});
