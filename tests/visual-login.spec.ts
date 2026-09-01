import { test, expect } from '@playwright/test';

/**
 * Sample failing visual regression test.
 *
 * This test captures the login page at
 * https://the-internet.herokuapp.com/login and compares it against a
 * committed baseline snapshot (`visual-login.spec.ts-snapshots/`).
 *
 * An intentional visual discrepancy is injected via `page.evaluate` right
 * before the snapshot comparison — it recolors the login button and injects
 * a banner element that does not exist on the real page — so the pixel
 * comparison against the clean baseline reliably fails in CI.
 *
 * This is deliberate — it exists to trigger a genuine Playwright visual
 * regression failure (with an image diff + trace.zip) so the Shorky
 * GitHub Action (whoff77/shorky@v1.1.0) can capture the failure artifacts
 * and analyze the mismatch.
 */
test('login page should match visual baseline', async ({ page }) => {
  await page.goto('/login');
  await page.waitForSelector('#login');

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

    const button = document.querySelector('#login button');
    if (button instanceof HTMLElement) {
      button.style.backgroundColor = 'magenta';
    }
  });

  await expect(page).toHaveScreenshot('login-page-baseline.png', {
    maxDiffPixelRatio: 0.01,
  });
});
