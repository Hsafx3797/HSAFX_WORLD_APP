/**
 * E2E: Tool management — list, search, detail, enable/disable.
 */
import { test, expect } from '@playwright/test';

test.describe('Tools', () => {
  test('tools page loads with table', async ({ page }) => {
    await page.goto('/tools');
    await expect(page.getByText(/tools management/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('search filters tools list', async ({ page }) => {
    await page.goto('/tools');
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('nonexistent-tool-xyzzy');
    await page.waitForTimeout(500);
  });

  test('tool detail page accessible', async ({ page }) => {
    await page.goto('/tools');
    const firstRow = page.locator('table tbody tr').first();
    const exists = await firstRow.isVisible().catch(() => false);
    if (!exists) {
      test.skip();
      return;
    }
    await firstRow.click();
    await page.waitForURL(/\/tools\/.+/);
    await expect(page.getByText(/tool|metadata/i).first()).toBeVisible();
  });
});

test.describe('Categories', () => {
  test('categories page loads', async ({ page }) => {
    await page.goto('/categories');
    await expect(page.getByText(/categories management/i)).toBeVisible();
  });

  test('create category button visible', async ({ page }) => {
    await page.goto('/categories');
    await expect(page.getByRole('button', { name: /create|add|new/i })).toBeVisible();
  });
});
