# Shorky Test Consumer

A minimal Node.js + TypeScript + Playwright project used to validate
[Shorky](https://github.com/whoff77/shorky)'s AI-powered auto-healing
GitHub Action end-to-end, consumed as a published marketplace action
(`whoff77/shorky@v1.0.0`).

## What this project does

1. Runs a small Playwright suite against a public demo site
   (`the-internet.herokuapp.com`).
2. `tests/broken-login.spec.ts` is **intentionally broken** — it targets
   locators that don't exist on the page (`XXXUsername` / `XXXPassword`
   labels) so the test reliably fails in CI.
3. When the suite fails, `.github/workflows/test.yml` invokes the published
   `whoff77/shorky@v1.0.0` GitHub Action, which:
   - Parses the Playwright JSON report (`test-results/report.json`) to find
     failed tests and their `trace.zip` attachments.
   - Sends the failure context to an LLM (via `OPENAI_API_KEY`) to generate
     a corrected spec.
   - Opens an auto-healing pull request with the fix using `GITHUB_TOKEN`.

## Prerequisites

* Node.js v18+
* A GitHub repository with the following secrets configured under
  **Settings > Secrets and variables > Actions**:
  * `OPENAI_API_KEY` — an OpenAI API key used by Shorky to generate the fix.
  * `GITHUB_TOKEN` is provided automatically by GitHub Actions and does not
    need to be added manually (referenced as `${{ secrets.GITHUB_TOKEN }}`
    in the workflow).

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
3. On failure, runs `whoff77/shorky@v1.0.0` with `openai-api-key` and
   `github-token` inputs to trigger the auto-healing pull request.
4. Always uploads the Playwright HTML report as a build artifact.

## Project structure

```text
shorky-test-consumer/
├── .github/
│   └── workflows/
│       └── test.yml          # CI: run Playwright + Shorky auto-healer
├── tests/
│   └── broken-login.spec.ts  # Intentionally failing sample test
├── playwright.config.ts      # Playwright configuration (trace: retain-on-failure)
├── tsconfig.json
└── package.json
```
