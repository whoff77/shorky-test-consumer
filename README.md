# Shorky Test Consumer

A minimal Node.js + TypeScript + Playwright project used to validate
[Shorky](https://github.com/whoff77/shorky)'s AI-powered auto-healing
GitHub Action end-to-end, consumed as a published marketplace action
(`whoff77/shorky@v1.3.7`).

## What this project does

1. Runs the Playwright suite in `tests/shorky-validation/` against a public
   demo site (`the-internet.herokuapp.com`).
2. Four spec files exercise different categories Shorky needs to handle,
   **intentionally** bundled into a single run so all failures land in one
   batch report and one consolidated pull request:
   - `broken-login-flow.spec.ts` — **DOM interaction failure**: targets
     stale locators (`#user-name` / `#pass-word`) that don't exist on the
     login page; the real ids are `#username` / `#password`.
   - `dynamic-form-elements.spec.ts` — **semantic action-contract errors**:
     calls `.fill()` on a native `<select>` (dropdown page) and on a
     checkbox (checkboxes page) instead of the correct `.selectOption()` /
     `.check()` actions.
   - `visual-regression-check.spec.ts` — **visual regression failure**:
     captures a screenshot of the dropdown page and compares it against a
     committed baseline
     (`tests/shorky-validation/visual-regression-check.spec.ts-snapshots/dropdown-page-baseline.png`),
     but first injects an intentional visual discrepancy (a red banner and
     a recolored control) via `page.evaluate`, so the pixel comparison
     reliably fails with a real image diff.
   - `clean-happy-path.spec.ts` — a **fully passing negative control**:
     correct locators and action contracts throughout, ensuring baseline
     assertions remain untouched and never trigger a false healing fix or
     PR participation.
3. When one or more specs fail, `.github/workflows/test.yml` invokes the
   published `whoff77/shorky@v1.3.7` GitHub Action, which:

   - Parses the Playwright JSON report (`test-results/report.json`) to find
     failed tests and their `trace.zip` / screenshot / visual-diff
     attachments.
   - For DOM/locator and semantic action-contract failures
     (`broken-login-flow.spec.ts`, `dynamic-form-elements.spec.ts`): sends
     the failure context to an LLM (via `OPENAI_API_KEY`) to generate a
     corrected spec, overwriting the original spec file in-place so the
     healing branch's CI run passes.
   - For visual regression failures (`visual-regression-check.spec.ts`): **bypasses
     LLM code generation entirely** ("Visual Diff Handoff" mode) since a
     genuine pixel discrepancy can never be fixed by rewriting selectors —
     instead, the expected/actual/diff PNG paths are packaged directly into
     the PR description under a **[Visual Review Required]** section for a
     human to review and either accept the new UI or fix the regression.
   - Commits all healed fixes from the run onto a single shared branch
     (`shorky/auto-heal-fixes`) and opens **one consolidated pull request**
     covering every failure — code fixes and visual-review flags alike —
     rather than a separate PR per failing test. Re-running the workflow
     updates the existing open PR instead of opening a duplicate.

## Prerequisites

* Node.js v18+
* **GitHub Repository Settings (for Auto-Healing PRs):** Navigate to your repository **Settings > Actions > General > Workflow permissions** and ensure **"Allow GitHub Actions to create and approve pull requests"** is checked.
* A GitHub repository with the following secrets configured under
  **Settings > Secrets and variables > Actions**:
  * `OPENAI_API_KEY` — an OpenAI API key used by Shorky to generate the fix.
  * `GITHUB_TOKEN` is provided automatically by GitHub Actions and does not
    need to be added manually (referenced as `${{ secrets.GITHUB_TOKEN }}`
    in the workflow).
* The workflow must grant `contents: write` and `pull-requests: write`
  permissions (see the `permissions:` block in
  [`.github/workflows/test.yml`](.github/workflows/test.yml)) — Shorky needs
  these to push the healing branch and open the pull request via the
  GitHub REST API using `GITHUB_TOKEN`. Without them, the branch/PR creation
  step will fail with a 403.

## Local setup

```bash
npm install
npx playwright install --with-deps chromium
npm test
```

Running `npm test` locally will fail on purpose (see above) — that's
expected. This project exists to exercise the CI healing flow, not to pass
locally.

## CI Workflow

See [`.github/workflows/test.yml`](.github/workflows/test.yml):

1. Checks out the repo and installs dependencies + Chromium.
2. Validates that required Shorky environment variables (`SHORKY_CLOUD_URL`,
   `SHORKY_CLOUD_API_KEY`, `GITHUB_REPOSITORY`, `GITHUB_TOKEN`) are present.
3. Runs `npx playwright test tests/shorky-validation --project="Google Chrome"`
   with `continue-on-error: true`, writing `test-results/report.json`, so
   every intentionally-broken spec runs to completion and all failures
   accumulate into one batch report instead of the job stopping at the
   first failure.
4. If any spec failed, runs `whoff77/shorky@v1.3.7` with `openai-api-key`,
   `shorky-cloud-api-key`, and `github-token` inputs against that single
   report to trigger the consolidated auto-healing pull request, then
   surfaces the true pass/fail status of the run.
5. Always uploads the Playwright HTML report and raw `test-results/`
   (traces, screenshots, diffs) as build artifacts.

## Project structure

```
shorky-test-consumer/
├── .github/
│   └── workflows/
│       └── test.yml                              # CI: run Playwright + Shorky auto-healer
├── tests/
│   └── shorky-validation/
│       ├── broken-login-flow.spec.ts             # DOM interaction failure (stale locators)
│       ├── dynamic-form-elements.spec.ts         # Semantic action-contract errors (select/checkbox)
│       ├── visual-regression-check.spec.ts       # Visual regression failure (screenshot diff)
│       ├── clean-happy-path.spec.ts              # Fully passing negative control
│       └── visual-regression-check.spec.ts-snapshots/
│           └── dropdown-page-baseline.png        # Committed clean baseline snapshot
├── playwright.config.ts      # Playwright configuration (trace: retain-on-failure)
├── tsconfig.json
└── package.json
```