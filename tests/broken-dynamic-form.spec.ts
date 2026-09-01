import { test, expect } from '@playwright/test';

/**
 * Sample failing DOM interaction test.
 *
 * This test targets the "Checkboxes" example page
 * (https://the-internet.herokuapp.com/checkboxes), which renders two plain
 * `<input type="checkbox">` elements with no labels, names, or accessible
 * text. The test is intentionally broken: it targets a checkbox via an
 * `id="checkbox-1"` selector that does not exist on the page (the real
 * inputs have no `id` attribute at all), so `locator.check()` reliably times
 * out and fails.
 *
 * This is deliberate — it exists to trigger a genuine Playwright DOM
 * interaction failure in CI so the Shorky GitHub Action
 * (whoff77/shorky@v1.1.0) can capture the failure trace/JSON report,
 * analyze it with an LLM, and open an auto-healing pull request with a
 * corrected locator (e.g. targeting the checkboxes by index/position
 * instead of a non-existent id).
 */
test('user should be able to toggle the first checkbox', async ({ page }) => {
  await page.goto('/checkboxes');

  // Intentionally incorrect locator (no such id exists) to force a failure
  // for Shorky to heal.
  const firstCheckbox = page.locator('#checkbox-1');
  await firstCheckbox.check();

  await expect(firstCheckbox).toBeChecked();
});
