# CLINE.md — shorky-test-consumer

## Project Overview

`shorky-test-consumer` is a **minimal sample Playwright + TypeScript project** used to validate the [`shorky`](https://github.com/whoff77/shorky) AI-powered auto-healing GitHub Action end-to-end, consuming it as a published marketplace action (`whoff77/shorky@v1.3.3`). It runs a small Playwright suite against a public demo site (`the-internet.herokuapp.com`) with **three intentionally broken spec files**, each exercising a different failure category Shorky must be able to heal:

- `tests/broken-login.spec.ts` — DOM interaction failure (locators reference nonexistent `XXXUsername` / `XXXPassword` labels).
- `tests/broken-dynamic-form.spec.ts` — DOM interaction failure (targets a nonexistent `#checkbox-1` id on the Checkboxes demo page).
- `tests/visual-login.spec.ts` — visual regression failure (injects a deliberate visual discrepancy via `page.evaluate` before comparing against a committed baseline snapshot).

When the suite fails in CI, `.github/workflows/test.yml` invokes the published Shorky action, which parses the Playwright JSON report, resolves failed specs/traces, and either LLM-generates a code fix (DOM failures) or packages a "Visual Review Required" section into a PR (visual regression). All fixes land on a single shared branch (`shorky/auto-heal-fixes`) via one consolidated pull request.

This repo exists purely to exercise the CI healing flow — **`npm test` is expected to fail locally on purpose.**

## Tech Stack & Core Tools

- **Language/Runtime:** TypeScript, Node.js
- **Test/Automation Engine:** Playwright (`@playwright/test`)
- **Target under test:** public demo site `https://the-internet.herokuapp.com` (configured as `baseURL`)
- **CI integration under test:** `whoff77/shorky@v1.3.3` GitHub Action (composite action from the sibling `shorky` repo)
- **Optional telemetry integration:** `shorky-cloud` (via `SHORKY_CLOUD_URL` / `SHORKY_CLOUD_API_KEY`)
- No build step, database, or backend — this is a pure Playwright test fixture project.

## Key Commands

```bash
# Install dependencies
npm install

# Install Playwright's Chromium browser
npx playwright install --with-deps chromium

# Run the suite (expected to fail locally — that's intentional)
npm test               # -> playwright test
npm run test:headed    # -> playwright test --headed

# Run a single spec / project directly
npx playwright test tests/broken-login.spec.ts --project="Google Chrome"
```

There is no lint, typecheck, or build script defined in `package.json`; `tsconfig.json` is used for editor/type-checking support only (`noEmit: true`).

### CI-only environment variables (see `.github/workflows/test.yml`)
- `SHORKY_CLOUD_URL` / `SHORKY_CLOUD_API_KEY` — optional telemetry/webhook target passed through to the Shorky action.
- `OPENAI_API_KEY` — used by the Shorky action to generate LLM-based fixes.
- `GITHUB_TOKEN` — used by the Shorky action to push the healing branch and open the PR (requires `contents: write` + `pull-requests: write` permissions, already set in the workflow).

## Architecture & Conventions

- **`tests/broken-login.spec.ts` / `tests/broken-dynamic-form.spec.ts`** — deliberately broken DOM-locator specs. When "fixing" these, the point is to observe/validate Shorky's auto-heal PR, not to hand-fix them directly unless testing a regression in Shorky itself.
- **`tests/visual-login.spec.ts`** — captures a screenshot after intentionally corrupting the UI, comparing against `tests/visual-login.spec.ts-snapshots/login-page-baseline.png`. Playwright's `snapshotPathTemplate` in `playwright.config.ts` deliberately omits the OS-specific suffix so the macOS-captured baseline is still compared pixel-for-pixel against Linux CI runs (keeps it a genuine pixel-diff failure, not a "missing snapshot").
- **`playwright.config.ts`** — single browser project (`Google Chrome`), `trace: 'retain-on-failure'` and `screenshot: 'only-on-failure'` so Shorky's fixer always has a trace.zip + screenshot to work from; JSON reporter writes to `test-results/report.json` (the path the Shorky action expects via `report-path`).
- **`.github/workflows/test.yml`** — runs on push/PR to `main`; installs deps + Chromium, runs the suite, and on failure invokes `whoff77/shorky@v1.3.3` with the report path, then always uploads the HTML report and raw `test-results/` (traces, screenshots, diffs) as build artifacts.
- **When updating the consumed Shorky action version:** bump the `uses: whoff77/shorky@vX.Y.Z` pin in `.github/workflows/test.yml` and mention the version in `README.md`.
- **Repository Settings requirement:** GitHub Actions must be allowed to create and approve pull requests (Settings > Actions > General > Workflow permissions) for the auto-heal PR step to succeed.
