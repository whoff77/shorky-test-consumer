import { test, expect } from '@playwright/test';

test('user should be able to toggle the first checkbox', async ({ page }) => {
  await page.goto('/checkboxes');

  // Correct locator using nth-child to select the first checkbox
  const firstCheckbox = page.locator('input[type="checkbox"]').first();
  await firstCheckbox.check();

  await expect(firstCheckbox).toBeChecked();
});
