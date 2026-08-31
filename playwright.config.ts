import { defineConfig, devices } from '@playwright/test';

/**
 * Shorky Test Consumer - Playwright configuration.
 *
 * This is a minimal sample project used to validate Shorky's AI-powered
 * auto-healing GitHub Action (whoff77/shorky) end-to-end: a deliberately
 * broken login test fails in CI, Playwright emits a JSON report with a
 * trace.zip, and the Shorky action analyzes the failure to open an
 * auto-healing pull request.
 *
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/report.json' }],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'https://the-internet.herokuapp.com',

    /* Collect trace on every failed attempt (including the final/terminal
     * retry) so Shorky's auto-fix pipeline can always locate a usable
     * trace.zip. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',

    /* Capture a screenshot only when a test fails. */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Google Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
});
