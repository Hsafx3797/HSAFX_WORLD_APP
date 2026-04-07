/**
 * E2E: Admin login flow and dashboard smoke test.
 * Requires ADMIN_EMAIL + ADMIN_PASSWORD env vars (or defaults for dev).
 *
 * Auth setup project (auth.setup.ts) logs in once and stores session
 * state at e2e/.auth/admin.json. Authenticated tests reuse it automatically.
 *
 * TODO [G18]: Only 4 smoke tests exist. Need comprehensive E2E coverage for:
 * - User CRUD (create, edit, delete, search, filter)
 * - Subscription management (view, cancel, refund)
 * - Tool management (enable/disable, edit metadata)
 * - Feature flag CRUD (create, toggle, delete)
 * - 2FA verification flow
 * - Impersonation flow (once UI is wired — see G16)
 * - Billing page (webhooks, transactions)
 * - Settings page (rate limits, maintenance mode)
 * - Analytics page (charts load, date range filter)
 * - RBAC (verify non-super_admin can't access restricted pages)
 */

import { test, expect } from '@playwright/test';

const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD env vars are required for E2E tests');
}

test.describe('Login', () => {
  // These run without stored auth
  test.use({ storageState: { cookies: [], origins: [] } });

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

    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });
});

test.describe('Authenticated', () => {
  // Uses stored auth from auth.setup.ts (via storageState in config)

  test('sidebar navigation links render', async ({ page }) => {
    await page.goto('/dashboard');

    for (const label of ['Users', 'Tools', 'Plans', 'Settings', 'Analytics']) {
      await expect(page.getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('analytics page loads charts', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Analytics' }).click();
    await page.waitForURL('**/analytics');
    await expect(page.getByText(/Cohort Analysis/i)).toBeVisible();
    await expect(page.getByText(/Conversion Funnel/i)).toBeVisible();
  });
});
