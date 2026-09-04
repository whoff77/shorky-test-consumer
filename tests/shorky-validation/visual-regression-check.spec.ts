import { test, expect } from '@playwright/test';

/**
 * Shorky validation: visual regression handling.
 *
 * This test captures the Dropdown demo page
 * (https://the-internet.herokuapp.com/dropdown) and compares it against a
 * committed clean baseline snapshot
 * (`visual-regression-check.spec.ts-snapshots/dropdown-page-baseline.png`).
 *
 * An intentional visual discrepancy is injected via `page.evaluate` right
 * before the snapshot comparison — it recolors the `<select>` control and
 * prepends a banner element that does not exist on the real page — so the
 * pixel comparison against the clean baseline reliably fails in CI.
 *
 * This is deliberate — it exists to trigger a genuine Playwright visual
 * regression failure (image diff + trace.zip) so Shorky can confirm:
 *   - The failure is correctly classified as a **visual regression**
 *     (`isVisualRegressionFailure()` in `src/engine/traceParser.ts`), not a
 *     DOM/locator failure.
 *   - Shorky's "Visual Diff Handoff" path is taken: LLM code-mutation is
 *     **bypassed entirely** (a pixel diff can never be "fixed" by rewriting
 *     selectors), and the failure is instead logged/staged with the
 *     expected/actual/diff PNG paths surfaced under a
 *     "[Visual Review Required]" section for human review — no incorrect
 *     code mutation should ever be attempted or committed for this test.
 */
test('dropdown page should match visual baseline', async ({ page }) => {
  await page.goto('/dropdown');
  await page.waitForSelector('#dropdown');

  // Intentionally introduce a visual discrepancy so the screenshot
  // comparison against the clean baseline fails for Shorky to investigate.
  await page.evaluate(() => {
    const banner = document.createElement('div');
    banner.textContent = 'INTENTIONAL VISUAL REGRESSION';
    banner.style.background = 'red';
    banner.style.color = 'white';
    banner.style.padding = '12px';
    banner.style.fontSize = '20px';
    banner.style.textAlign = 'center';
    document.body.prepend(banner);

    const dropdown = document.querySelector('#dropdown');
    if (dropdown instanceof HTMLElement) {
      dropdown.style.backgroundColor = 'magenta';
      dropdown.style.border = '4px solid lime';
    }
  });

  await expect(page).toHaveScreenshot('dropdown-page-baseline.png', {
    maxDiffPixelRatio: 0.01,
  });
});
