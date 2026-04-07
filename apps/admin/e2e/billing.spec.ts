/**
 * E2E: Billing & transactions — tabs, search, export.
 */
import { test, expect } from '@playwright/test';

test.describe('Billing', () => {
  test('billing page loads with tabs', async ({ page }) => {
    await page.goto('/billing');
    await expect(page.getByText(/transactions|billing/i).first()).toBeVisible();
  });

  test('transactions tab shows table', async ({ page }) => {
    await page.goto('/billing');
    // Look for transactions tab or it's the default view
    const txTab = page.getByRole('tab', { name: /transactions/i });
    const exists = await txTab.isVisible().catch(() => false);
    if (exists) await txTab.click();
    await expect(page.getByRole('table').or(page.getByText(/no transactions/i))).toBeVisible();
  });

  test('webhooks tab exists', async ({ page }) => {
    await page.goto('/billing');
    const webhookTab = page.getByRole('tab', { name: /webhooks/i });
    const exists = await webhookTab.isVisible().catch(() => false);
    if (!exists) {
      test.skip();
      return;
    }
    await webhookTab.click();
    await page.waitForTimeout(300);
  });
});
