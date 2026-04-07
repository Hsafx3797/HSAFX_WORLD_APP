/**
 * E2E: Analytics page — charts, date range, sections.
 */
import { test, expect } from '@playwright/test';

test.describe('Analytics', () => {
  test('analytics page loads with date inputs', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.getByText(/analytics/i).first()).toBeVisible();
    // Date range inputs
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.first()).toBeVisible();
  });

  test('cohort analysis section visible', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.getByText(/cohort analysis/i)).toBeVisible();
  });

  test('conversion funnel section visible', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.getByText(/conversion funnel/i)).toBeVisible();
  });

  test('export button exists', async ({ page }) => {
    await page.goto('/analytics');
    const exportBtn = page.getByRole('button', { name: /export|csv|download/i });
    await expect(exportBtn).toBeVisible();
  });
});
