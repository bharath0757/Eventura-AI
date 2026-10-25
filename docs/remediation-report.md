# Evaluation remediation report

Status: 25 October 2026. Verification below distinguishes the public evaluated branch, the complete baseline, and the current remediation candidate.

## A. Root cause

The user confirmed evaluation of the public repository's default **main** branch. Anonymous GitHub inspection verified [bharath0757/Eventura-AI](https://github.com/bharath0757/Eventura-AI), with current main at `8bff9947b826ae8512724ea46d561640ef7504b7`. That tree contains **no test files, test script, test dependencies or CI workflow**. It also lacks the saved-event wizard/dashboard routes and server-side Gemini service found on `codex/eventura-ui-redesign`.

The complete branch at `754d73992422cae08693d29cdef995a5fe7f4fc0` had 250 passing tests in ten files, locked test dependencies and working standard commands. A fresh anonymous public clone passed installation, lint, type checking, all 250 tests, build and diff checks without environment files. The earlier 222-test report described a different version from current main. Publishing the correct complete application is therefore the primary repair; adding tests only to an unevaluated branch cannot correct Testing 0.

This mismatch also provides a concrete explanation for weak challenge alignment: main exposes a template demonstration instead of the complete category-specific planning and assistant journey. The exact historical checkout, evaluation timestamp and proprietary rubric were not supplied, so the mismatch's effect on the reported 0/100 and 74/100 remains an inference. Other confirmed gaps in the complete baseline were absent CI, coverage reporting and repeatable full-browser workflows. See [testing-audit.md](testing-audit.md).

## B. Testing improvements and results

Existing planner, validation, optimizer, storage, AI contract/provider/API and React interaction tests were retained. They cover exact integer accounting, min/max and rounding budgets, all three categories, same-day/urgent dates, invalid inputs, protected allocations and reserves, stale/tampered proposals, record immutability, failed saves, backwards-compatible records, SDK failures and honest fallback.

The candidate adds calendar boundary and all-protected-budget regression cases, explicit credential removal and denial of unmocked network calls in ordinary tests. Vitest and its matching V8 coverage provider are pinned to 4.1.12; Playwright 1.64.1 adds six complete workflows in desktop and mobile Chromium. Browser tests exercise real navigation, wizard forms, all five plan deliverables, contextual requests, idea deduplication, comparison/rejection/confirmed acceptance, task reload/reopening, actual no-key API fallback, simulated request failure and input/error focus.

| Verification | Observed result |
| --- | --- |
| Fresh public baseline: `npm ci`, lint, typecheck, `npm test`, build, diff check | Passed; 250 tests, zero failures; no environment files |
| Candidate unit/integration/component suite and coverage | **258 passed in ten files; zero failures** |
| Candidate lint, typecheck, unit suite and production build | Passed again after correcting text encoding |
| Candidate desktop/mobile browser suite | **12 passed; zero failures** in the final post-edit run |
| Candidate dependency audit | **Zero reported vulnerabilities** after the Vitest patch update |
| Fresh candidate checkout at `0d86ff5`: install, lint, typecheck, test, coverage, build, browser tests, diff check | **All passed**; 258 unit tests, 12 browser tests, clean Git status, no runtime environment files |

Coverage includes every file in planner, validation, storage, AI and date modules, including uncovered files. It is not whole-application/UI coverage.

| Scoped coverage | Result | Gate |
| --- | ---: | ---: |
| Statements | 96.00% | 90% |
| Branches | 91.20% | 85% |
| Functions | 98.59% | 90% |
| Lines | 99.32% | 95% |

Optimizer and storage each have 100% line/function coverage, with separate statement/branch/line/function gates. Financial invariants and browser interactions remain independent checks; coverage alone does not establish correctness.

Reproduce with Node 24: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run build`, install Chromium, `npm run test:e2e`, then `git diff --check`. Linux Chromium installation is `npx playwright install --with-deps --only-shell chromium`; Windows omits `--with-deps`. See [testing.md](testing.md). Ordinary commands require no Gemini key and do not invoke the live smoke runner.

## C. CI verification

The candidate adds `.github/workflows/ci.yml` for pushes to main/the complete branch, pull requests to main and manual dispatch. It runs Node 24 installation, locked dependencies, lint, typecheck, coverage tests, production build, desktop/mobile browser tests and diff checks. Official actions are pinned to commit hashes; permissions are read-only, timeout is 15 minutes, retries are zero, production secrets are absent and failures are not concealed with `continue-on-error`. Ignored synthetic diagnostics are retained as hosted artifacts for three days.

**Hosted CI result and public workflow publication: pending.** A locally passing equivalent is not a successful GitHub Actions run. Current evaluated main has no workflow. Final evidence must identify the actual public commit and hosted run.

## D. Problem alignment

The complete implementation already supplies functional category-specific plans; remediation verifies that behavior and improves discovery without redesigning working screens. Three copy clarifications name the exact deliverables on the first screen, identify the dashboard assistant and explain where AI assistance follows starter-plan creation. Primary and category actions lead directly to the appropriate wizard.

| Challenge requirement | Implementation and verification |
| --- | --- |
| GenAI planning assistant | `/api/ai/plan`, `src/lib/ai/` and `ai-assistant.tsx`; contextual structured prompts, server-only SDK, contract/provider/API/component tests. Genuine contextual-question smoke scenario D passed; live recommendations/optimization remain unverified after the wedding recommendation timeout. |
| Weddings | `/events/new?category=wedding`; ceremony/theme inputs and distinct profiles; planner/validation tests and desktop/mobile wedding creation workflows |
| Birthdays | Birthday wizard, age/style/activity inputs and distinct plans; category tests and desktop/mobile creation/idea/reopening workflows |
| Community events | Community wizard, purpose/format/volunteer inputs and distinct coordination milestones; category and desktop/mobile workflows |
| Budgets | Exact dashboard allocations and protected optimization; optimizer invariants plus browser comparison, rejection and confirmed persistent acceptance |
| Timelines | Date-based milestones, urgency and persistent statuses; date/planner tests and reload/reopening browser checks |
| Vendor checklists | Category-specific supplier/helper tasks and statuses; planner/storage tests and preserved vendor progress after budget acceptance |
| Personalized ideas | Context-sensitive starter ideas, requested source-labelled assistant ideas and saved deduplicated suggestions; category, contract, component and browser tests |
| Connected journey | Landing → wizard → dashboard → ideas/question → protected budget preview → accept/reject → saved events; six browser workflows on two viewport configurations |

[problem-alignment.md](problem-alignment.md) gives exact routes, files and test references, including contingencies. The prompt uses the selected event's category, budget, guests, date, style, priorities, dietary/access needs and category details. Deterministic starter content and fallback are explicitly labelled; no live vendor availability or quotations are invented.

## E. Live AI verification

Three forms of evidence must remain separate:

- **Mocked AI:** Unit/API/component tests mock the provider boundary; ordinary browser successes explicitly use schema-valid synthetic responses. They establish request context, validation and workflow behavior, not genuine Gemini inference.
- **Rule-based fallback:** The browser suite calls the actual local API with explicit empty Gemini credentials and verifies the fallback label and usable planning. Simulated transport failure leaves saved data unchanged and task controls usable.
- **Genuine provider requests:** Existing production code `bdc4c63` is deployed at [the stable app](https://eventura-ai.vercel.app) and [the immutable release](https://eventura-elzk1uzwl-bharath0757s-projects.vercel.app). A production-only server-side Secret is configured for Gemini 3.8. Earlier requests failed with provider HTTP 503 or timed out. **A new genuine contextual-question smoke scenario D passed against that immutable production deployment in 25,555 ms: source `live-ai`, schema valid, four context clues and no record modification.** The name-filtered run reported one passed and four excluded scenarios; it was not a five-scenario live pass. The subsequent filtered A/C/E run failed on A wedding recommendations after 60,705 ms with honestly labelled timeout fallback. Stop-after-first-failure skipped C and E; B and D were excluded by that filter. Thus genuine contextual questions are verified, while live category recommendations and optimization remain unverified. Fresh Vercel metadata confirms the existing sensitive production-only Secret; its value was not retrieved.

The bounded `npm run ai:smoke` remains separate, uses synthetic events, verifies genuine source/contracts/accounting, stops after the first failure and never persists browser events. The successful D request establishes actual inference for that scenario on existing production, not all category or optimization outputs and not a new remediation deployment. Four of the six additional requests authorized across this work were used: earlier D timeout and A 503, then D success and A timeout; two remain unused. No further live requests are planned for this remediation. A green skipped smoke run does not count as live success.

## F. Regression audit

No runtime dependency, authentication system, database or financial-policy relaxation was introduced. New dependencies support development testing only. The Vitest patch upgrade removes the identified audit findings. Credentials stay server-only; no production secret was copied, exposed or changed by this remediation. Ordinary test credentials are explicitly empty and unmocked network requests fail visibly. Credential-pattern checks found no matches in tracked files or 18 client build chunks. A comparison confirmed that 46 source/asset files in the shared checkout were unchanged.

Exact budget totals, locked amounts, reserve policy, preview immutability, explicit approval and storage-failure reporting remain covered. Existing labels and focus behavior are retained; browser tests exercise labelled controls, acknowledgement gating and invalid-input focus. Desktop/mobile production-browser tests verify the real local application with mocked/no-key AI. No final manual visual check was performed, as requested.

The existing Security 100, Efficiency 100 and Accessibility 96 scores are regression goals, not remeasured or guaranteed outcomes. This is not a new comprehensive security audit, performance benchmark or full accessibility conformance assessment.

## G. Repository and submission readiness

| Item | Current evidence |
| --- | --- |
| Repository | Public anonymous access verified: `https://github.com/bharath0757/Eventura-AI.git` |
| Working/submission branch | `codex/eventura-ui-redesign` |
| Complete public baseline | `754d73992422cae08693d29cdef995a5fe7f4fc0` |
| Evaluated default main | `8bff9947b826ae8512724ea46d561640ef7504b7`; still missing the complete implementation/tests at audit time |
| Deployed application code | `bdc4c63`; remediation deployment not established |
| Local remediation code commit | `0d86ff5dcf36b21d3abdfa48d09a4800cba4ac4c`; not pushed at this snapshot |
| Final documentation/publication commit / public main integration | Pending publication and verification |
| Code candidate `0d86ff5` tracked source | **110 files; 4,483,891 bytes** (4.48 MB decimal) |
| Code candidate Git storage | **3,126,980 bytes** all-refs pack estimate; **4,232 KiB** loose-object storage |
| Final documentation-inclusive measurements | Remeasure after the final documentation/publication commit |

The candidate includes ten unit/API/component test files, fixtures/setup, two browser-test source files, test configurations, lockfile, Node-version declaration, CI and these evidence documents. Dependencies, build output, secrets, coverage, browser installations, traces and reports are excluded. No generated browser video or binary installation is submitted. The measured code candidate's tracked source and Git object/pack sizes are below the strict 10 MB limit. Recheck after the final documentation commit rather than attributing the candidate's exact count to a later commit.

Existing valid commits and parallel main branding history are preserved. No reset, history rewrite, force-push or discard of shared uncommitted work is required to integrate the complete application. The publication repair is a normal reviewed integration of the verified complete branch into the branch the evaluator actually uses.

## H. Remaining limitations

1. Main integration, final public commit, final documentation-inclusive size measurement and an actual hosted CI pass are still pending at this snapshot. Until main contains the complete verified version, the original evaluation mismatch remains.
2. Genuine Gemini scenario D passed. A wedding recommendations timed out to fallback; C/E were skipped after that failure and B was excluded. Live category recommendations and optimization therefore remain unverified. One contextual-question success does not establish complete live coverage or availability.
3. Final clean-candidate checks passed against exact `0d86ff5`, including locked installation, all 258 tests, coverage gates, build and 12 browser tests; no runtime environment files existed and final Git status was clean. Hosted CI and evaluated-branch publication still require separate evidence.
4. Browser coverage is desktop/mobile Chromium, not every browser, assistive technology or visual layout. Manual final visual review was intentionally omitted.
5. Browser-local persistence does not sync across origins/devices and is not transactional across simultaneous tabs. Server-instance rate limiting is best-effort, not distributed production abuse protection.
6. The evaluator's exact historical commit and rubric are unknown. No particular new score can be promised.

## I. Final recommendation

Request reevaluation only after the complete verified implementation, tests, lockfile, CI and evidence documents are publicly present on the actual evaluated branch; a final clean checkout passes every documented command and browser suite; the hosted CI run is green; and final source/Git sizes are confirmed under 10 MB. Record the exact commit and immutable deployment submitted.

The genuine D success supports the contextual-question claim on existing production. Disclose the A timeout and unverified live category/optimization scenarios before reevaluation; do not present these partial results as a complete live workflow pass. Demonstrate the clearly labelled fallback separately. Reevaluate the software and its reproducible evidence, without predicting the evaluator's score.
