import { test, expect } from '@playwright/test';

/**
 * Shorky validation: semantic action-contract healing.
 *
 * This test exercises two "action contract" mistakes on demo pages that
 * expose form controls with well-defined interaction semantics:
 *
 *  1. Dropdown page (https://the-internet.herokuapp.com/dropdown) — `#dropdown`
 *     is a native `<select>` element. Instead of using Playwright's
 *     `selectOption()` API (the correct action contract for `<select>`),
 *     this test intentionally calls `.fill()` / `.click()` on it, which
 *     either throws ("Element is not an <input>, <textarea> or
 *     [contenteditable] element") or silently fails to change the selected
 *     option — a classic "wrong action for element type" mistake.
 *
 *  2. Checkboxes page (https://the-internet.herokuapp.com/checkboxes) — the
 *     first `<input type="checkbox">` has no `id`/`name`/label, so this test
 *     intentionally tries to interact with it via `.fill('true')` (a text
 *     action, invalid on a checkbox) instead of the correct `.check()`
 *     action contract.
 *
 * These are deliberate — they exist to trigger genuine Playwright semantic
 * action-contract errors (not missing-locator errors) in CI so Shorky's LLM
 * diagnostics can recognize the element type from the DOM snapshot and
 * correct the *action* used against it (e.g. `.fill()` -> `.selectOption()`,
 * `.fill()` -> `.check()`) rather than merely rewriting a selector.
 */
test.describe('Shorky validation: dynamic form elements', () => {
  test('user should be able to choose Option 2 from the dropdown', async ({ page }) => {
    await page.goto('/dropdown');

    const dropdown = page.locator('#dropdown');

    // Intentionally incorrect action contract: `<select>` elements must be
    // driven via `selectOption()`, not `fill()`. Shorky should correct this
    // to `await dropdown.selectOption('2')`.
    await dropdown.fill('Option 2');

    await expect(dropdown).toHaveValue('2');
  });

  test('user should be able to check the first checkbox', async ({ page }) => {
    await page.goto('/checkboxes');

    const checkboxes = page.locator('#checkboxes input[type="checkbox"]');
    const firstCheckbox = checkboxes.nth(0);

    // Intentionally incorrect action contract: checkboxes must be toggled
    // via `check()`, not `fill()`. Shorky should correct this to
    // `await firstCheckbox.check()`.
    await firstCheckbox.fill('true');

    await expect(firstCheckbox).toBeChecked();
  });
});
