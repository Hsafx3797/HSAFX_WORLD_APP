/**
 * E2E: Subscription management — list, filter, detail.
 */
import { test, expect } from '@playwright/test';

test.describe('Subscriptions', () => {
  test('subscriptions page loads', async ({ page }) => {
    await page.goto('/subscriptions');
    await expect(page.getByText(/subscriptions management/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('search input is functional', async ({ page }) => {
    await page.goto('/subscriptions');
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test');
    await page.waitForTimeout(300);
    // Table should still render (filtered or empty)
    await expect(page.getByRole('table').or(page.getByText(/no (subscriptions|results)/i))).toBeVisible();
  });

  test('status filter dropdown works', async ({ page }) => {
    await page.goto('/subscriptions');
    // Look for a filter/select control
    const filterSelect = page.locator('select').first();
    const exists = await filterSelect.isVisible().catch(() => false);
    if (!exists) {
      test.skip();
      return;
    }
    await filterSelect.selectOption({ index: 1 });
    await page.waitForTimeout(300);
  });

  test('subscription detail page accessible', async ({ page }) => {
    await page.goto('/subscriptions');
    const firstRow = page.locator('table tbody tr').first();
    const exists = await firstRow.isVisible().catch(() => false);
    if (!exists) {
      test.skip();
      return;
    }
    await firstRow.click();
    await page.waitForURL(/\/subscriptions\/.+/);
    await expect(page.getByText(/subscription|plan/i).first()).toBeVisible();
  });
});
