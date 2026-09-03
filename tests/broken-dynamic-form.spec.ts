import { test, expect } from '@playwright/test';

test('user should be able to toggle the first checkbox', async ({ page }) => {
  await page.goto('/checkboxes');

  // Correct locator using nth() to select the first checkbox
  const firstCheckbox = page.locator('form#checkboxes input[type="checkbox"]').nth(0);
  await firstCheckbox.check();

  await expect(firstCheckbox).toBeChecked();
});
