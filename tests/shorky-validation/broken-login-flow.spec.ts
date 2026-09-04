import { test, expect } from '@playwright/test';

/**
 * Shorky validation: DOM/locator healing.
 *
 * This test targets the login page (https://the-internet.herokuapp.com/login)
 * with **intentionally outdated locators**. The real accessible ids/labels on
 * the page are `#username` / `#password` (label text "Username" /
 * "Password"), but this spec references stale ids (`#user-name` /
 * `#pass-word`) as if a previous DOM refactor had renamed the fields and the
 * test was never updated.
 *
 * This is deliberate — it exists to trigger a genuine Playwright locator
 * timeout in CI so Shorky's auto-heal pipeline (`whoff77/shorky`) can:
 *   1. Inspect the failure trace/JSON report and the failed selector.
 *   2. Ask the LLM fixer to resolve the *current* correct locator for the
 *      same semantic field (username/password/login button).
 *   3. Submit the healed spec via the CLI (`fixTrace.ts` -> batch report
 *      flow) onto the shared consolidated healing branch.
 */
test.describe('Shorky validation: broken login flow', () => {
  test('user should be able to log in with the current username/password fields', async ({ page }) => {
    await page.goto('/login');

    // Intentionally stale locators — the real ids are #username / #password.
    // Shorky should heal these back to the correct, currently-rendered ids.
    await page.locator('#user-name').fill('tomsmith');
    await page.locator('#pass-word').fill('SuperSecretPassword!');

    await page.getByRole('button', { name: /Login/ }).click();

    await expect(page).toHaveURL(/\/secure/);
    await expect(page.locator('#flash')).toContainText('You logged into a secure area!');
  });
});
