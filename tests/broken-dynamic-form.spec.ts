import { test, expect } from '@playwright/test';

test('user should be able to toggle the first checkbox', async ({ page }) => {
  await page.goto('/checkboxes');

  // Correct locator by selecting the first checkbox using nth(0)
  const firstCheckbox = page.locator('input[type="checkbox"]').nth(0);
  await firstCheckbox.check();

  await expect(firstCheckbox).toBeChecked();
});
