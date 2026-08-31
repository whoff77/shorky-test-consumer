import { test, expect } from '@playwright/test';

/**
 * Sample failing login test.
 *
 * This test is intentionally broken: it targets label text ("XXXUsername" /
 * "XXXPassword") that does not exist on the page. The real accessible labels
 * are "Username" and "Password". This is deliberate — it exists to trigger a
 * genuine Playwright test failure in CI so the Shorky GitHub Action
 * (whoff77/shorky@v1.0.0) can capture the failure trace and JSON report,
 * analyze it with an LLM, and open an auto-healing pull request with the fix.
 */
test('user should be able to log in', async ({ page }) => {
  await page.goto('/login');

  // Intentionally incorrect locators to force a failure for Shorky to heal.
  await page.getByLabel('XXXUsername').fill('tomsmith');
  await page.getByLabel('XXXPassword').fill('SuperSecretPassword!');

  await page.getByRole('button', { name: /Login/ }).click();

  await expect(page).toHaveURL(/\/secure/);
});
