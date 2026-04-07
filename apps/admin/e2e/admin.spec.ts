/**
 * E2E: Admin login flow and dashboard smoke test.
 * Requires ADMIN_EMAIL + ADMIN_PASSWORD env vars (or defaults for dev).
 *
 * Auth setup project (auth.setup.ts) logs in once and stores session
 * state at e2e/.auth/admin.json. Authenticated tests reuse it automatically.
 *
 * Coverage overview (split across spec files):
 * - admin.spec.ts: Login + dashboard smoke
 * - users.spec.ts: User CRUD, detail, impersonation
 * - subscriptions.spec.ts: Subscription management
 * - tools.spec.ts: Tool management + categories
 * - feature-flags.spec.ts: Feature flag CRUD
 * - billing.spec.ts: Billing + transactions
 * - settings.spec.ts: Settings page
 * - analytics.spec.ts: Analytics charts + export
 * - rbac.spec.ts: Admin users, activity logs, RBAC nav verification
 * - b2b.spec.ts: B2B plans, suites, quotas, subscriptions, usage
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
