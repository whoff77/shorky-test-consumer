import type { FullConfig } from '@playwright/test';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Establishes ONE shared run identifier for this entire Playwright suite
 * execution — including every parallel worker process Playwright spawns —
 * before any worker/test starts running.
 *
 * `globalSetup` runs exactly once, in the single main test-runner process,
 * strictly before Playwright forks its worker processes (see
 * `playwright.config.ts`'s `workers` setting, which now enables real
 * multi-worker parallelism). Any value written to `process.env` here is
 * inherited by every worker process because Node's `child_process.fork()`
 * (which Playwright uses internally to spawn workers) copies the parent
 * process's `process.env` at fork time — so all workers observe the exact
 * same `SHORKY_RUN_ID`, and failures discovered concurrently across
 * different workers still resolve to the same shared execution context.
 *
 * The ID is ALSO persisted to `test-results/.shorky-run-id` because this
 * `process.env` mutation is local to the Playwright test process and does
 * not propagate to sibling CI steps — e.g. the separate `whoff77/shorky`
 * action step that later runs `fixTrace.ts` in its own shell step/process.
 * Writing the ID to disk lets the Shorky CLI recover the identical run ID
 * after the Playwright process has already exited, so the batch report,
 * the consolidated healing PR, and the shorky-cloud telemetry dispatch all
 * end up tagged with one single `runId` instead of fragmenting per worker.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const runId = process.env.SHORKY_RUN_ID || randomUUID();
  process.env.SHORKY_RUN_ID = runId;

  const outputDir = 'test-results';
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, '.shorky-run-id'), runId, 'utf-8');

  // In GitHub Actions, also export SHORKY_RUN_ID to $GITHUB_ENV so it is
  // visible to *subsequent* workflow steps (e.g. the separate `whoff77/shorky`
  // action step, which runs fixTrace.ts as its own process after this
  // Playwright run has already exited). This is a second, belt-and-suspenders
  // propagation path alongside the ".shorky-run-id" file written above —
  // either one is sufficient for fixTrace.ts to recover the exact same ID.
  if (process.env.GITHUB_ENV) {
    fs.appendFileSync(process.env.GITHUB_ENV, `SHORKY_RUN_ID=${runId}\n`, 'utf-8');
  }

  console.log(
    `🆔 [Shorky] Established shared suite run ID "${runId}" for this execution (workers=${config.workers ?? 'default'}) — every parallel worker process will inherit it.`
  );
}
