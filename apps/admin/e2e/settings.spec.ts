/**
 * E2E: Settings page — rate limits, maintenance mode, integration settings.
 */
import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText(/settings/i).first()).toBeVisible();
  });

  test('rate limits section visible', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText(/rate limit/i).first()).toBeVisible();
  });

  test('save button exists', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
});
