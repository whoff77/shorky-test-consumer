import { test, expect } from '@playwright/test';

/**
 * Shorky validation: clean happy-path baseline.
 *
 * This spec is a fully passing, standard Playwright test against the
 * checkboxes demo page (https://the-internet.herokuapp.com/checkboxes),
 * using correct locators and correct action contracts throughout (unlike
 * `dynamic-form-elements.spec.ts`, which deliberately misuses the same
 * page's controls).
 *
 * It exists purely as a **negative control** for the Shorky validation
 * suite: baseline assertions here must remain untouched by the auto-healer,
 * and this test passing must never contribute a "failure" to the batch
 * report Shorky's CLI consumes — so it must never trigger a spec rewrite,
 * a staged healing fix, or false PR creation/participation in the
 * consolidated pull request opened for the other (intentionally broken)
 * specs in this run.
 */
test.describe('Shorky validation: clean happy path', () => {
  test('user should be able to check and uncheck the checkboxes correctly', async ({ page }) => {
    await page.goto('/checkboxes');

    const checkboxes = page.locator('#checkboxes input[type="checkbox"]');
    const firstCheckbox = checkboxes.nth(0);
    const secondCheckbox = checkboxes.nth(1);

    // Correct initial state per the demo page: first unchecked, second checked.
    await expect(firstCheckbox).not.toBeChecked();
    await expect(secondCheckbox).toBeChecked();

    // Correct action contracts: `.check()` / `.uncheck()` for checkboxes.
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();

    await secondCheckbox.uncheck();
    await expect(secondCheckbox).not.toBeChecked();
  });

  test('login page should render the expected form fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Login/ })).toBeVisible();
  });
});
