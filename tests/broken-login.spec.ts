import { test, expect } from '@playwright/test';

test('user should be able to log in', async ({ page }) => {
  await page.goto('/login');

  // Correct locators for the input fields
  await page.getByLabel('Username').fill('tomsmith');
  await page.getByLabel('Password').fill('SuperSecretPassword!');

  await page.getByRole('button', { name: /Login/ }).click();

  await expect(page).toHaveURL(/\/secure/);
});
