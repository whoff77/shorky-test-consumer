import { test, expect } from '@playwright/test';

test('user should be able to toggle the first checkbox', async ({ page }) => {
  await page.goto('/checkboxes');

  // Correct locator targeting the first checkbox input element
  const firstCheckbox = page.locator('form#checkboxes input[type="checkbox"]').first();
  await firstCheckbox.check();

  await expect(firstCheckbox).toBeChecked();
});
