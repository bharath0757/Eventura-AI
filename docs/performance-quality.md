# Performance and code-quality verification

The competition dashboard supplied by the user scored the published project 93.9 overall: code quality 88, efficiency 80, security 99, testing 99, accessibility 98 and problem alignment 98. No scoring rubric or evaluator comments were supplied. The implementation targets measurable browser cost and maintainability; laboratory metrics cannot predict or guarantee a score above 97.6.

## Baseline and measurement method

The baseline is default-main commit `df5477351af034a1321098ca35e930107803279b`. It was measured from its preserved local production build before rebuilding the candidate. [The numeric baseline](performance-baseline.json) retains eight desktop/mobile resource measurements, task updates with 1/25/100 saved events, and three mobile Lighthouse runs for each of landing, wizard, saved-events and populated dashboard routes.

Each resource measurement uses a fresh browser context and cold browser cache. It includes navigation and Next.js prefetch through network idle, using one synthetic wedding record. Decoded CSS/JS, transfer totals, CSS coverage and font transfer are recorded. Initial decoded CSS includes both linked stylesheet resources and all rendered style element bodies; it does not become zero when CSS is delivered inline. The baseline immutable deployment was checked on all four routes and had no style element bodies. The candidate also records HTML decoded/transfer sizes so CSS delivery trade-offs remain visible. gzip JS/CSS totals independently compress each recorded response body at level 9; duplicate recorded requests count separately. Baseline gzip bodies were reread from the same preserved build and every decoded size was checked against the original navigation measurement. These gzip totals are a deterministic bundle comparison, not the host's negotiated compression.

The task update timing dispatches a change and waits for two animation frames, then verifies that the final status was persisted. Five samples are collected per collection size. Frame scheduling contributes to the result; it is not a field INP measurement or an isolated storage benchmark.

Mobile Lighthouse uses default simulated throttling and identical settings in baseline and candidate. Scores, LCP and CLS are reported as medians of three audits per route. The baseline dashboard had a median performance score of 88 and CLS of about 0.177. This identifies a loading-layout problem that a smaller bundle alone would not address.

## Reproduce

Install Node 24, run `npm ci`, build the intended revision, and start an isolated production server without a Gemini key. Keep a server/build fixed throughout collection. Install Chromium with `npx playwright install --with-deps chromium`.

```powershell
$env:GEMINI_API_KEY = ''
$env:GEMINI_MODEL = ''
npm run build
npm run start -- --hostname 127.0.0.1 --port 3044
```

In another terminal:

```powershell
node scripts/performance.mjs --url http://127.0.0.1:3044 --label candidate --runs 3
node scripts/performance-check.mjs --candidate test-results/performance/candidate.json --markdown test-results/performance/comparison.md
```

When only the Playwright headless-shell browser is installed, supply its executable through `--chrome-path`. The resource harness uses Playwright's installed Chromium; Lighthouse accepts that explicit Chrome executable. Reports contain synthetic numeric diagnostics and asset paths, with no screenshots or provider prompts. The benchmark does not call the AI endpoint.

The check fails if any route/viewport lacks its measurement, has browser errors, omits linked/inline CSS accounting, reduces initial decoded CSS by less than 30%, or increases gzip JavaScript resource bytes. The JS gate measures runtime script resources, excluding serialized RSC/HTML data; HTML sizes are recorded separately. It also requires three mobile audits per route with median performance at least 95, LCP at most 2,500 ms and CLS at most 0.1, plus all three persisted task-update benchmarks. Missing measurements fail validation. GitHub Actions retains numeric reports and enforces the same checks alongside formatting, lint, types, unit coverage and desktop/mobile browser workflows.

## Delivery choices

The landing page renders static sections on the server and loads its interactive sample dialog on demand. Saved-event routes load their own styles and use system fonts. Home links in the planner defer landing-page prefetch so its font and styles are not downloaded during initial planning. The LCP photograph has responsive sizes and high fetch priority. Both surfaces use system sans-serif fonts with Georgia for display headings, eliminating font downloads and late font swaps.

The dashboard reserves loading geometry and defers the optional assistant until its section is reached. Task changes use the validated record returned by persistence, with cross-tab reload behavior retained. Full plan, request, output and financial checks remain in place.

## Candidate result

Candidate capture and final checks are pending. This section must be updated with the generated comparison, verification results and exact published revision before claiming completion. Baseline results are evidence of the old build only.

## Bounded live Gemini comparison

A separately authorized live experiment compared `gemini-3.8-flash` and `gemini-3.5-flash-lite` using synthetic details, at most twelve requests and a first-failure stop for each model. Two requests were made:

| Model                 | First wedding scenario                                   |   Elapsed | Usage observed                              |
| --------------------- | -------------------------------------------------------- | --------: | ------------------------------------------- |
| Gemini 3.8 Flash      | Provider HTTP 503; labelled fallback                     | 46,638 ms | Unavailable                                 |
| Gemini 3.5 Flash-Lite | Unusable structured/semantic response; labelled fallback |  3,364 ms | 2,094 input / 535 output / 0 thought tokens |

Both models stopped after the first failure. The remaining scenarios and winner confirmations were not run. The comparison harness completed, but neither request established a validated live result. Token counts are provider-reported for that one request; they do not establish billing cost or matched latency superiority. No model change is justified, so the existing `gemini-3.8-flash` default remains. Mocked API/browser tests and successful fallback responses do not prove live Gemini inference. The earlier verified contextual question is historical evidence recorded in the remediation report.

The opt-in runner is `npm run ai:compare`, guarded by `AI_COMPARE_ENABLED=1`, a configured key and an unused `AI_COMPARE_REPORT` destination. Never run it as part of ordinary tests or CI. Do not rerun a failed comparison automatically or spend remaining quota merely to obtain a green result.
