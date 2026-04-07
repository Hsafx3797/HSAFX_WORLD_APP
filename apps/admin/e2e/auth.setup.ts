import { test as setup, expect } from '@playwright/test';

const EMAIL = process.env.ADMIN_EMAIL ?? 'admin@hsafx.world';
const PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123456';

const AUTH_FILE = 'e2e/.auth/admin.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 10_000 });

  await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
