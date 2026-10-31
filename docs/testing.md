# Reproducible testing

Use **Node 24** (`.nvmrc`) and the committed npm lockfile. No Google account, environment file, Gemini key, database or login is required for ordinary checks.

```sh
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
npx playwright install --with-deps --only-shell chromium
npm run test:e2e
git diff --check
```

On Windows, `npx playwright install --only-shell chromium` installs the one required browser; Linux CI uses `--with-deps` for browser OS libraries. Browsers are cached outside the repository. Build before the browser suite. The suite starts and owns its production server at `127.0.0.1:3046`, refuses to reuse another server and shuts its own server down afterwards. If 3046 is occupied, stop the conflicting test server deliberately; do not point these tests at a credentialed production deployment. Your normal app on 3000/3044 is not the browser test target.

## What the layers prove

| Command / files                                                       | Evidence                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`, `tests/planner.test.ts`, `validation.test.ts`             | Category profiles, budgets from minimum to maximum, rounding, exact totals, date/guest validation, urgent tasks, distinct ideas/vendors/risks                                                                                               |
| `tests/optimizer.test.ts`                                             | Reducing/increasing targets, protected catering/multiple/all categories, reserve, infeasibility, tampering/staleness, exact integers and progress preservation                                                                              |
| `tests/ai-contracts.test.ts`, `ai-provider.test.ts`, `ai-api.test.ts` | Mocked SDK success/failures, strict contracts, byte/input/output limits, authentication/quota/timeouts/cancellation, origin checks, throttling and honest fallback                                                                          |
| `tests/storage.test.ts`, optimizer persistence cases                  | CRUD, statuses, ideas/deduplication, older version-1 records, corrupt/denied/full storage and no false success after failure                                                                                                                |
| `tests/ai-ui.test.ts`, `dashboard-recovery.test.ts`                   | Actual component actions, cancellation, acknowledgement, reject/accept, failed saves, malformed responses and usable recovery                                                                                                               |
| `npm run test:e2e`, `e2e/planning.spec.ts`                            | Six complete UI workflows in desktop and mobile Chromium: all categories, contextual ideas/questions, locked comparison, reject/accept, reload/reopen persistence, real no-key fallback, simulated network failure and keyboard/error focus |

The browser AI boundary is explicitly mocked using schema-valid synthetic context for deterministic tests; those responses are not real Gemini output. The missing-key browser case calls the real local Eventura API. Its server has explicit empty Gemini environment values. Unit setup also empties credentials and rejects unmocked `fetch` calls, making accidental external requests fail visibly. Live smoke files are excluded from ordinary Vitest discovery.

The accessibility browser cases also check all wizard steps and error hints, saved events, dashboard, all three assistant results and sample tabs with axe WCAG 2 A/AA and 2.1 AA rules. They verify keyboard tab navigation, modal focus restoration, temporary sample progress and downloaded plan contents. These automated checks do not establish complete WCAG conformance. The photo-loading cases verify that offscreen birthday/community images are absent from initial requests, decode when reached, and remain available with JavaScript disabled. The newer component regressions invalidate advice after task progress changes and verify that successful mutations use returned records without a second storage read.

## Coverage

`npm run test:coverage` uses the matching Vitest V8 provider. It includes **all files** in the planner, validation, storage, AI and Utsav history modules, plus date utilities, including uncovered modules. It does not claim coverage of the entire UI or the real provider. Text, LCOV and JSON-summary reports are generated in ignored `coverage/`.

Measured regression gates: critical-logic totals require 90% statements, 85% branches, 90% functions and 95% lines. The optimizer requires 95/90/100/100, and both the basic record store and assistant-aware storage facade require 95/90/100/100 respectively. These gates were set after measuring the existing suite, with calendar and all-protected-budget boundary tests added for real uncovered behavior. They are not a substitute for the browser workflows or financial invariant assertions. See [remediation-report.md](remediation-report.md) for actual results.

## CI and failures

`.github/workflows/ci.yml` runs on pushes to main, pull requests to main and manual dispatch. It installs Node 24 and dependencies, runs formatting, lint, type checking, coverage tests, production build and both browser projects. An optional 25-minute performance job runs only on manual workflow dispatch, measures all four routes and checks the historical performance budgets. It is skipped for ordinary PR/main releases. It uses read-only repository permissions, pinned official actions, a 15-minute timeout, concurrency cancellation and no production secrets. No failing step uses `continue-on-error`. Browser retries are zero. Synthetic reports/traces are retained as CI artifacts for three days; none are committed.

For a browser failure, inspect the failing locator/output, `playwright-report/` or the retained trace. Do not weaken assertions or skip a broken workflow. For a coverage failure, inspect the reported uncovered branch and add a meaningful regression case when needed. A clean command exit, not the presence of a report, establishes success.

## Separate genuine Gemini smoke

Only explicitly authorized live verification uses `npm run ai:smoke` with a configured server-side key. Its defaults and remote opt-in are documented in README. It uses synthetic events, validates actual API source/contracts/financial invariants, never persists user events and stops after its first failure. It is never invoked by ordinary CI/build/test commands. Current live status must come from an actual provider run, not these mocks or coverage percentages.

## Utsav companion regressions

`tests/chat-api.test.ts` and `tests/chat-provider.test.ts` exercise general/event contracts, context consistency, bounded history, server-derived source labels, provider failure and cancellation. `tests/utsav-history.test.ts` verifies per-thread isolation, 50-message truncation, 1 MiB UTF-8 limits, denied/quota/corrupt storage and preservation of other threads and version-1 event records. `tests/event-snapshot.test.ts` also verifies shared consumers and reconnect behavior.

`e2e/utsav.spec.ts` adds eight scenarios in both desktop and mobile Chromium. The complete suite has 38 browser cases; critical-logic tests total 375. Tests include invitation editing and a clipboard boundary stub that verifies the exact copied text, context switching, no request on opening, persistence/clearing, safe text rendering, fallback/network errors, focus restoration, reduced motion and compact viewport sizing. Successful mocked requests are never reported as verified live Gemini output.

The user removed the added size cap and automatic score checks for this release. The original performance scripts remain available on manual workflow dispatch. See [Utsav verification](utsav.md) for the separate bounded live-check outcome.
