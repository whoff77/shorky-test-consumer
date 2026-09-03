import { test, expect } from '@playwright/test';

test('user should be able to log in', async ({ page }) => {
  await page.goto('/login');

  // Correct locators to match the actual labels on the page.
  await page.getByLabel('Username').fill('tomsmith');
  await page.getByLabel('Password').fill('SuperSecretPassword!');

  await page.getByRole('button', { name: /Login/ }).click();

  await expect(page).toHaveURL(/\/secure/);
});
