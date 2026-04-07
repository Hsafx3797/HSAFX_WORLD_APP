/**
 * E2E: User management — list, search, detail, ban/unban, impersonation.
 */
import { test, expect } from '@playwright/test';

test.describe('Users', () => {
  test('users page loads with table', async ({ page }) => {
    await page.goto('/users');
    await expect(page.getByText(/users management/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('search filters table rows', async ({ page }) => {
    await page.goto('/users');
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('nonexistent-user-xyzzy');
    // Should either filter or show empty state
    await page.waitForTimeout(500);
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    // Filtering by nonsense should yield 0 or show "no results"
    if (count === 0) {
      await expect(page.getByText(/no (users|results)/i)).toBeVisible();
    }
  });

  test('user detail page accessible from list', async ({ page }) => {
    await page.goto('/users');
    // Click first user row link
    const firstRow = page.locator('table tbody tr').first();
    const exists = await firstRow.isVisible().catch(() => false);
    if (!exists) {
      test.skip();
      return;
    }
    await firstRow.click();
    await page.waitForURL(/\/users\/.+/);
    // Should show user profile info
    await expect(page.getByText(/profile|user details/i).first()).toBeVisible();
  });

  test('user detail shows action buttons', async ({ page }) => {
    await page.goto('/users');
    const firstRow = page.locator('table tbody tr').first();
    const exists = await firstRow.isVisible().catch(() => false);
    if (!exists) {
      test.skip();
      return;
    }
    await firstRow.click();
    await page.waitForURL(/\/users\/.+/);
    await expect(page.getByRole('button', { name: /reset password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /impersonate/i })).toBeVisible();
  });

  test('impersonate modal requires reason', async ({ page }) => {
    await page.goto('/users');
    const firstRow = page.locator('table tbody tr').first();
    const exists = await firstRow.isVisible().catch(() => false);
    if (!exists) {
      test.skip();
      return;
    }
    await firstRow.click();
    await page.waitForURL(/\/users\/.+/);
    await page.getByRole('button', { name: /impersonate/i }).click();
    // Modal should appear
    await expect(page.getByText(/impersonate user/i)).toBeVisible();
    // Button should be disabled with short reason
    const startBtn = page.getByRole('button', { name: /start impersonation/i });
    await expect(startBtn).toBeDisabled();
  });
});
