# Shorky Test Consumer

A minimal Node.js + TypeScript + Playwright project used to validate
[Shorky](https://github.com/whoff77/shorky)'s AI-powered auto-healing
GitHub Action end-to-end, consumed as a published marketplace action
(`whoff77/shorky@v1.2.0`).

## What this project does

1. Runs a small Playwright suite against a public demo site
   (`the-internet.herokuapp.com`).
2. Three spec files are **intentionally broken** to exercise different
   failure categories Shorky needs to be able to heal:
   - `tests/broken-login.spec.ts` — **DOM interaction failure**: targets
     locators that don't exist on the login page (`XXXUsername` /
     `XXXPassword` labels).
   - `tests/broken-dynamic-form.spec.ts` — **DOM interaction failure**:
     targets a checkbox on the
     [Checkboxes](https://the-internet.herokuapp.com/checkboxes) example
     page via a non-existent `#checkbox-1` id (the real inputs have no
     `id` attribute at all).
   - `tests/visual-login.spec.ts` — **visual regression failure**: captures
     a screenshot of the login page and compares it against a committed
     baseline (`tests/visual-login.spec.ts-snapshots/login-page-baseline.png`),
     but first injects an intentional visual discrepancy (a red banner and a
     recolored login button) via `page.evaluate`, so the pixel comparison
     reliably fails with a real image diff.
3. When the suite fails, `.github/workflows/test.yml` invokes the published
   `whoff77/shorky@v1.2.0` GitHub Action, which:
   - Parses the Playwright JSON report (`test-results/report.json`) to find
     failed tests and their `trace.zip` / screenshot / visual-diff
     attachments.
   - Sends the failure context to an LLM (via `OPENAI_API_KEY`) to generate
     a corrected spec for each failing file, overwriting the original spec
     file in-place so the healing branch's CI run passes.
   - Commits all healed fixes from the run onto a single shared branch
     (`shorky/auto-heal-fixes`) and opens **one consolidated pull request**
     covering every failure, rather than a separate PR per failing test.
     Re-running the workflow updates the existing open PR instead of
     opening a duplicate.

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
2. Runs `npx playwright test --reporter=json,list`, writing
   `test-results/report.json`.
3. On failure, runs `whoff77/shorky@v1.2.0` with `openai-api-key` and
   `github-token` inputs to trigger the auto-healing pull request.
4. Always uploads the Playwright HTML report as a build artifact.

## Project structure

```
shorky-test-consumer/
├── .github/
│   └── workflows/
│       └── test.yml                    # CI: run Playwright + Shorky auto-healer
├── tests/
│   ├── broken-login.spec.ts            # DOM interaction failure (broken locators)
│   ├── broken-dynamic-form.spec.ts     # DOM interaction failure (checkboxes page)
│   ├── visual-login.spec.ts            # Visual regression failure (screenshot diff)
│   └── visual-login.spec.ts-snapshots/
│       └── login-page-baseline.png     # Committed clean baseline snapshot
├── playwright.config.ts      # Playwright configuration (trace: retain-on-failure)
├── tsconfig.json
└── package.json
```