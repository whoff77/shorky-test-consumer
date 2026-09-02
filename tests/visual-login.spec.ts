import { test, expect } from '@playwright/test';

test('login page should match visual baseline', async ({ page }) => {
  await page.goto('/login');
  await page.waitForSelector('#login');

  // Remove the intentional visual discrepancy code.

  await expect(page).toHaveScreenshot('login-page-baseline.png', {
    maxDiffPixelRatio: 0.01,
  });
});
