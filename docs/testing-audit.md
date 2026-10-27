# Testing and evaluation audit

Audit started 25 October 2026, before remediation edits.

## Confirmed source mismatch

The user confirmed that the evaluation used the default **main** branch. Unauthenticated GitHub API/tree requests identified current main as `8bff9947b826ae8512724ea46d561640ef7504b7`; no evaluation timestamp or separate historical commit was supplied, so this is the verified current submitted branch state, not proof of the evaluator's exact historical checkout.

| Item                                           | Public main at 8bff994      | Complete branch at 754d739                              |
| ---------------------------------------------- | --------------------------- | ------------------------------------------------------- |
| Tracked test suites                            | None                        | 10 Vitest test files plus fixtures                      |
| Standard test command                          | Missing                     | npm test: vitest run                                    |
| Type check command                             | Missing                     | npm run typecheck                                       |
| Test dependencies                              | Missing                     | Vitest, jsdom, Testing Library in manifest and lockfile |
| CI workflow                                    | None                        | None before this remediation                            |
| Saved-event wizard/dashboard                   | Missing                     | /events/new, /events/[eventId], /events                 |
| Server-side Gemini integration                 | Missing                     | /api/ai/plan and src/lib/ai                             |
| Durable task progress / protected optimization | Demo session only / missing | Implemented and tested                                  |

This is the strongest confirmed explanation for Testing 0/100 and incomplete challenge alignment: the evaluator was directed at a different application than the one described by the earlier 222-test report. The exact proprietary scoring rubric and evaluation commit are unavailable; a particular score increase cannot be guaranteed.

## Additional testing gaps

The complete branch's Vitest include pattern discovers tests/**/*.test.ts, and its tracked test files are not ignored. Test dependencies are locked. Provider responses are mocked in unit/API tests, and genuine live smoke tests are separate. README documents standard test commands. No GitHub Actions, reproducible browser suite or coverage command existed. Existing UI tests covered the assistant and recovery, but not all three category wizards through browser navigation. These are real gaps to repair; rewriting the existing valid suite would not fix main's missing files.

## Clean baseline verification

A fresh public clone of the complete branch at 754d739, with no environment files, passed npm ci, lint, typecheck, all 250 baseline tests, build and git diff --check. This confirms the existing suite is runnable; the absence of that suite from main is the publication defect. Additional remediation and final clean-clone results are recorded in docs/remediation-report.md.

## Remediation scope

Preserve the complete planner, tests, Phase 3 history, official branding and parallel main history. Add isolated browser workflow tests, critical-logic coverage, CI and a requirements-to-evidence matrix. Clarify the existing landing and assistant entry points without redesigning screens. Publish verified changes on the existing complete branch and correct the evaluated default-branch mismatch through a reviewed, non-destructive integration. Keep Gemini production credentials server-only; keep ordinary tests and CI offline from the provider.
