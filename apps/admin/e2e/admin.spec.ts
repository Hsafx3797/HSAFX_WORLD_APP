/**
 * E2E: Admin login flow and dashboard smoke test.
 * Requires ADMIN_EMAIL + ADMIN_PASSWORD env vars (or defaults for dev).
 */

import { test, expect } from '@playwright/test';

const EMAIL = process.env.ADMIN_EMAIL ?? 'admin@hsafx.world';
const PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123456';

test.describe('Admin Panel', () => {
  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('login → dashboard redirect', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });

  test('sidebar navigation links render', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    // Check key nav items are present
    for (const label of ['Users', 'Tools', 'Plans', 'Settings', 'Analytics']) {
      await expect(page.getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('analytics page loads charts', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 10_000 });

    await page.getByRole('link', { name: 'Analytics' }).click();
    await page.waitForURL('**/analytics');
    await expect(page.getByText(/Cohort Analysis/i)).toBeVisible();
    await expect(page.getByText(/Conversion Funnel/i)).toBeVisible();
  });
});
