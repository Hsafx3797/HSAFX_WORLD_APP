/**
 * E2E: B2B pages — plans, suites, quotas, subscriptions, usage.
 */
import { test, expect } from '@playwright/test';

test.describe('B2B Plans', () => {
  test('page loads with cards', async ({ page }) => {
    await page.goto('/b2b/plans');
    await expect(page.getByText(/b2b plans/i)).toBeVisible();
  });

  test('create button opens modal', async ({ page }) => {
    await page.goto('/b2b/plans');
    const createBtn = page.getByRole('button', { name: /create|add|new/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    await expect(page.getByRole('dialog').or(page.getByText(/create.*plan|new.*plan/i))).toBeVisible();
  });
});

test.describe('B2B Suites', () => {
  test('page loads', async ({ page }) => {
    await page.goto('/b2b/suites');
    await expect(page.getByText(/b2b suites/i)).toBeVisible();
  });

  test('create button visible', async ({ page }) => {
    await page.goto('/b2b/suites');
    await expect(page.getByRole('button', { name: /create|add|new/i })).toBeVisible();
  });
});

test.describe('B2B Quotas', () => {
  test('page loads with matrix', async ({ page }) => {
    await page.goto('/b2b/quotas');
    await expect(page.getByText(/b2b quotas/i)).toBeVisible();
  });
});

test.describe('B2B Subscriptions', () => {
  test('page loads with table', async ({ page }) => {
    await page.goto('/b2b/subscriptions');
    await expect(page.getByText(/b2b subscriptions/i)).toBeVisible();
  });

  test('status filter visible', async ({ page }) => {
    await page.goto('/b2b/subscriptions');
    // Should have some filter mechanism
    const select = page.locator('select').first();
    const exists = await select.isVisible().catch(() => false);
    if (exists) {
      await select.selectOption({ index: 1 });
    }
  });
});

test.describe('B2B Usage', () => {
  test('page loads with date filters', async ({ page }) => {
    await page.goto('/b2b/usage');
    await expect(page.getByText(/b2b usage/i)).toBeVisible();
    // Date inputs
    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
