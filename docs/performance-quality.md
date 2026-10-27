# Performance and code-quality verification

The competition dashboard supplied by the user scored the published project 93.9 overall: code quality 88, efficiency 80, security 99, testing 99, accessibility 98 and problem alignment 98. No scoring rubric or evaluator comments were supplied. The implementation targets measurable browser cost and maintainability; laboratory metrics cannot predict or guarantee a score above 97.6.

## Baseline and measurement method

The baseline is default-main commit `df5477351af034a1321098ca35e930107803279b`. It was measured from its preserved local production build before rebuilding the candidate. [The numeric baseline](performance-baseline.json) retains eight desktop/mobile resource measurements, task updates with 1/25/100 saved events, and three mobile Lighthouse runs for each of landing, wizard, saved-events and populated dashboard routes.

Each resource measurement uses a fresh browser context and cold browser cache. It includes navigation and Next.js prefetch through network idle, using one synthetic wedding record. Decoded CSS/JS, transfer totals, CSS coverage and font transfer are recorded. Initial decoded CSS includes both linked stylesheet resources and all rendered style element bodies; it does not become zero when CSS is delivered inline. The baseline immutable deployment was checked on all four routes and had no style element bodies. The candidate also records HTML decoded/transfer sizes so CSS delivery trade-offs remain visible. gzip JS/CSS totals independently compress each recorded response body at level 9; duplicate recorded requests count separately. Baseline gzip bodies were reread from the same preserved build and every decoded size was checked against the original navigation measurement. These gzip totals are a deterministic bundle comparison, not the host's negotiated compression.

The task update timing dispatches a change and waits for two animation frames, then verifies that the final status was persisted. Five samples are collected per collection size. Frame scheduling contributes to the result; it is not a field INP measurement or an isolated storage benchmark.

Mobile Lighthouse uses default simulated throttling and identical settings in baseline and candidate. The baseline was captured on the local Windows machine; release candidates are also measured on GitHub's Ubuntu runner. Byte budgets compare recorded assets directly, while Lighthouse and interaction timings remain laboratory observations affected by host hardware and scheduling, rather than an isolated cross-platform causal benchmark. Scores, LCP and CLS are reported as medians of three audits per route. The baseline dashboard had a median performance score of 88 and CLS of about 0.177. This identifies a loading-layout problem that a smaller bundle alone would not address.

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

When only the Playwright headless-shell browser is installed, supply its executable through `--chrome-path`. The resource harness uses Playwright's installed Chromium; Lighthouse accepts that explicit Chrome executable. Reports contain synthetic numeric diagnostics and asset paths, with no screenshots or provider prompts. The benchmark does not call the AI endpoint. CI installs the pinned Playwright headless shell for both browser collection and Lighthouse, avoiding an unused full-browser download. The report records the executable name and engine version.

The check fails if any route/viewport lacks its measurement, has browser errors, omits linked/inline CSS accounting, reduces initial decoded CSS by less than 30%, or increases gzip JavaScript resource bytes. The JS gate measures runtime script resources, excluding serialized RSC/HTML data; HTML sizes are recorded separately. It also requires three mobile audits per route with median performance at least 95, LCP at most 2,500 ms and CLS at most 0.1, plus all three persisted task-update benchmarks. Missing measurements fail validation. GitHub Actions retains numeric reports and enforces the same checks alongside formatting, lint, types, unit coverage and desktop/mobile browser workflows.

## Delivery choices

The landing page renders static sections on the server and loads its interactive sample dialog on demand. Saved-event routes load their own styles and use system fonts. Home links in the planner defer landing-page prefetch so its styles are not downloaded during initial planning. The LCP photograph has responsive sizes, high fetch priority and quality 50 encoding (19,074 bytes at the audited 640 px WebP size). Static landing images use server-side `getImageProps`, retaining image optimization without a client image component or hydration. Both surfaces use system sans-serif fonts with Georgia for display headings, eliminating font downloads and late font swaps. Occasion photographs load when their reserved frames are within 250 px of the viewport, with a no-JavaScript image fallback; they no longer compete with the hero photograph during initial loading.

The dashboard reserves loading geometry and defers the optional assistant until its section is reached. Later panels use [native content visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility) with reserved size to avoid offscreen layout and paint work while retaining find-in-page and keyboard access. Accessibility checks scroll each later panel into view before analyzing it. Task changes use the validated record returned by persistence, with cross-tab reload behavior retained. Basic record access is isolated from the assistant-aware persistence facade, so optional optimization code is downloaded only with the assistant. Full plan, request, output and financial checks remain in place.

## Candidate result

The release implementation is commit `d9360c744558b9b0ca1222aeea21e827fe5e3419`. [GitHub Actions run 14](https://github.com/bharath0757/Eventura-AI/actions/runs/40441575406) measured its PR merge checkout `aaae0f136c491df4113280beae4374711e8c0b0b` on Ubuntu, Node v24.21.0, Chromium 156.0.8078.4 and Lighthouse 13.5.0. All original byte and mobile performance gates passed. [The complete comparison](performance-comparison.md), [candidate measurements](performance-candidate.json) and [machine-readable comparison](performance-comparison.json) preserve all eight route/viewport results, twelve audits and collection-size benchmarks.

| Mobile route | Performance median | LCP median | CLS median |
| ------------ | -----------------: | ---------: | ---------: |
| landing      |                 98 |    2366 ms |   0.000018 |
| wizard       |                 99 |    2110 ms |   0.000000 |
| saved        |                 99 |    1962 ms |   0.000000 |
| dashboard    |                 98 |    2349 ms |   0.000000 |

Initial CSS fell from 99,365 bytes to 52,088 on the landing page (47.58%) and 58,182 on event routes (41.45%), in both viewports. Initial gzip JavaScript also fell on every route: landing 159,237 → 145,239 bytes; wizard 219,801 → 194,943; saved events 213,297 → 183,563; dashboard 223,168 → 191,100. Font transfer is zero. CSS remains externally cacheable; linked and inline accounting is still enforced.

The 1/25/100-event mutation checks all persisted the final completed status, with medians of about 33.3 ms to two animation frames. These frame-limited observations show no measured interaction speedup; the separate regression proves the redundant storage read was removed. Dashboard CLS fell from the recorded baseline 0.1774 to zero. Hardware differences and synthetic fixtures limit causal timing comparisons.

Verification at this implementation: 286 unit tests in 14 files, all 22 desktop/mobile browser cases, formatting, lint, types and production build passed. Scoped critical-logic coverage is 96.69% statements, 93.03% branches, 98.64% functions and 97.53% lines; strict optimizer and both storage gates pass. Original twelve browser workflows remain included, alongside accessibility and photo-loading regressions. Ordinary tests and performance benchmarks make no Gemini calls.

The tracked source is about 2.8 MB, below the 10 MB submission budget and the 4.49 MB baseline; dependencies, builds, credentials and generated browser diagnostics are excluded. The reviewed release is tracked by [PR 2](https://github.com/bharath0757/Eventura-AI/pull/2); its final merge and deployment checks identify the published main revision. The retained candidate report describes the measured implementation above, rather than claiming a new competition result.

## Bounded live Gemini comparison

A separately authorized live experiment compared `gemini-3.8-flash` and `gemini-3.5-flash-lite` using synthetic details, at most twelve requests and a first-failure stop for each model. Two requests were made:

| Model                 | First wedding scenario                                   |   Elapsed | Usage observed                              |
| --------------------- | -------------------------------------------------------- | --------: | ------------------------------------------- |
| Gemini 3.8 Flash      | Provider HTTP 503; labelled fallback                     | 46,638 ms | Unavailable                                 |
| Gemini 3.5 Flash-Lite | Unusable structured/semantic response; labelled fallback |  3,364 ms | 2,094 input / 535 output / 0 thought tokens |

Both models stopped after the first failure. The remaining scenarios and winner confirmations were not run. The comparison harness completed, but neither request established a validated live result. Token counts are provider-reported for that one request; they do not establish billing cost or matched latency superiority. No model change is justified, so the existing `gemini-3.8-flash` default remains. Mocked API/browser tests and successful fallback responses do not prove live Gemini inference. The earlier verified contextual question is historical evidence recorded in the remediation report.

The opt-in runner is `npm run ai:compare`, guarded by `AI_COMPARE_ENABLED=1`, a configured key and an unused `AI_COMPARE_REPORT` destination. Never run it as part of ordinary tests or CI. Do not rerun a failed comparison automatically or spend remaining quota merely to obtain a green result.
