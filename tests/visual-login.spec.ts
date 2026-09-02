import { test, expect } from '@playwright/test';

test('login page should match visual baseline', async ({ page }) => {
  await page.goto('/login');
  await page.waitForSelector('#login');

  // Remove the intentional visual discrepancy code
  // await page.evaluate(() => {
  //   const banner = document.createElement('div');
  //   banner.textContent = 'INTENTIONAL VISUAL REGRESSION';
  //   banner.style.background = 'red';
  //   banner.style.color = 'white';
  //   banner.style.padding = '12px';
  //   banner.style.fontSize = '20px';
  //   banner.style.textAlign = 'center';
  //   document.body.prepend(banner);

  //   const button = document.querySelector('#login button');
  //   if (button instanceof HTMLElement) {
  //     button.style.backgroundColor = 'magenta';
  //   }
  // });

  await expect(page).toHaveScreenshot('login-page-baseline.png', {
    maxDiffPixelRatio: 0.01,
  });
});
