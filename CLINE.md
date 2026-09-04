# CLINE.md — shorky-test-consumer

## Project Overview

`shorky-test-consumer` is a **minimal sample Playwright + TypeScript project** used to validate the [`shorky`](https://github.com/whoff77/shorky) AI-powered auto-healing GitHub Action end-to-end, consuming it as a published marketplace action (`whoff77/shorky@v1.3.7`). It runs a single Playwright suite (`tests/shorky-validation/`) against a public demo site (`the-internet.herokuapp.com`) with **four spec files**, each exercising a different category Shorky must be able to handle:

- `tests/shorky-validation/broken-login-flow.spec.ts` — DOM interaction failure (stale locators `#user-name` / `#pass-word`; the real ids are `#username` / `#password`).
- `tests/shorky-validation/dynamic-form-elements.spec.ts` — semantic action-contract errors (`.fill()` on a `<select>`/checkbox instead of `.selectOption()` / `.check()`) to verify the LLM diagnostics correct the *action*, not just the selector.
- `tests/shorky-validation/visual-regression-check.spec.ts` — visual regression failure (injects a deliberate visual discrepancy via `page.evaluate` before comparing against a committed baseline snapshot on the dropdown page).
- `tests/shorky-validation/clean-happy-path.spec.ts` — a fully passing negative-control spec that must never trigger a healing fix or false PR participation.

When the suite fails in CI, `.github/workflows/test.yml` runs the suite with `continue-on-error: true` (so every intentionally-broken spec runs to completion and all failures accumulate into a single Playwright JSON report), then invokes the published Shorky action, which parses the report, resolves failed specs/traces, and either LLM-generates a code fix (DOM/semantic failures) or packages a "Visual Review Required" section into a PR (visual regression). All fixes land on a single shared branch (`shorky/auto-heal-fixes`) via one consolidated pull request, sharing one `suiteRunId`.

This repo exists purely to exercise the CI healing flow — **`npm test` is expected to fail locally on purpose.**

## Tech Stack & Core Tools

- **Language/Runtime:** TypeScript, Node.js
- **Test/Automation Engine:** Playwright (`@playwright/test`)
- **Target under test:** public demo site `https://the-internet.herokuapp.com` (configured as `baseURL`)
- **CI integration under test:** `whoff77/shorky@v1.3.7` GitHub Action (composite action from the sibling `shorky` repo)
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
npx playwright test tests/shorky-validation/broken-login-flow.spec.ts --project="Google Chrome"
```

There is no lint, typecheck, or build script defined in `package.json`; `tsconfig.json` is used for editor/type-checking support only (`noEmit: true`).

### CI-only environment variables (see `.github/workflows/test.yml`)
- `SHORKY_CLOUD_URL` / `SHORKY_CLOUD_API_KEY` — optional telemetry/webhook target passed through to the Shorky action.
- `OPENAI_API_KEY` — used by the Shorky action to generate LLM-based fixes.
- `GITHUB_TOKEN` — used by the Shorky action to push the healing branch and open the PR (requires `contents: write` + `pull-requests: write` permissions, already set in the workflow).

## Architecture & Conventions

- **`tests/shorky-validation/broken-login-flow.spec.ts` / `dynamic-form-elements.spec.ts`** — deliberately broken DOM-locator / semantic action-contract specs. When "fixing" these, the point is to observe/validate Shorky's auto-heal PR, not to hand-fix them directly unless testing a regression in Shorky itself.
- **`tests/shorky-validation/visual-regression-check.spec.ts`** — captures a screenshot of the dropdown page after intentionally corrupting the UI, comparing against `tests/shorky-validation/visual-regression-check.spec.ts-snapshots/dropdown-page-baseline.png`. Playwright's `snapshotPathTemplate` in `playwright.config.ts` deliberately omits the OS-specific suffix so the macOS-captured baseline is still compared pixel-for-pixel against Linux CI runs (keeps it a genuine pixel-diff failure, not a "missing snapshot").
- **`tests/shorky-validation/clean-happy-path.spec.ts`** — negative control; must never be touched by the auto-healer or contribute to the batch report.
- **`playwright.config.ts`** — single browser project (`Google Chrome`), `trace: 'retain-on-failure'` and `screenshot: 'only-on-failure'` so Shorky's fixer always has a trace.zip + screenshot to work from; JSON reporter writes to `test-results/report.json` (the path the Shorky action expects via `report-path`).
- **`.github/workflows/test.yml`** — runs on push/PR to `main`; installs deps + Chromium, validates required env vars, runs `tests/shorky-validation` with `continue-on-error: true` so all failures batch into one report, invokes `whoff77/shorky@v1.3.7` against that report when any spec failed, then always uploads the HTML report and raw `test-results/` (traces, screenshots, diffs) as build artifacts.
- **When updating the consumed Shorky action version:** bump the `uses: whoff77/shorky@vX.Y.Z` pin in `.github/workflows/test.yml` and mention the version in `README.md`.
- **Repository Settings requirement:** GitHub Actions must be allowed to create and approve pull requests (Settings > Actions > General > Workflow permissions) for the auto-heal PR step to succeed.
