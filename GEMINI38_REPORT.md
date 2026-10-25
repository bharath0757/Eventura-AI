# Eventura AI — earlier Gemini 3.8 release verification

Historical snapshot from earlier on **25 October 2026**. The [current remediation report](docs/remediation-report.md) supersedes its live status: a later contextual-question request succeeded, while recommendations still timed out. The current testing and publication evidence is also in that report.

Verified **25 October 2026**. The release is published and usable with rule-based assistance. **Successful live Gemini inference remains blocked:** the latest actual provider request returned HTTP 503. A configured Secret, passing mocked tests and usable fallback do not establish live AI success.

## Release and preservation of background work

- Complete application branch: [codex/eventura-ui-redesign](https://github.com/bharath0757/Eventura-AI/tree/codex/eventura-ui-redesign).
- Deployed application commit: **bdc4c63741ed4d7ecef16a1e6f58b11d9cfc89a5**. The documentation commit follows it without changing runtime code.
- Phase 3 commit `8374316` and subsequent Phase 4 history remain ancestors. No Phase 3 cherry-pick, duplicate implementation, reset, rebase, force push or worktree deletion was used.
- Parallel `main` advanced to `8bff994`, adding official branding while omitting the complete saved planner and assistant. This discrepancy was investigated before integration. Merge `3a42c57` incorporates that current branding into the complete planner branch; both previous release `79baa11` and main `8bff994` are ancestors. This merges subsequent main work, not Phase 3 a second time.
- The shared `D:\Eventura AI` checkout was left on `main`. SHA-256 comparisons of 46 source/assets against the start-of-day baseline found **zero changes** from this work. Its background history and official assets are preserved. All implementation work used the existing isolated checkout.
- Commits were pushed normally to the feature branch. The intended remote remains `https://github.com/bharath0757/Eventura-AI.git`; the final remote-state check follows publication.

## Actual automated results

Node **24.19.0**, Next.js **16.4.3**, React **19.3.1**, Google GenAI SDK **2.31.0**, installed lockfile and existing architecture retained.

| Executed command | Result |
| --- | --- |
| `npm test` | **250 passed, 10 files**; no provider requests |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; landing, saved events, wizard, event dashboard and AI route generated |
| `git diff --check` | Passed after runtime edits; repeated for final documentation |
| `AI_SMOKE_MODE=fallback npm run ai:smoke` | **5 passed** against actual local production API |
| Authorized remote live smoke | **1 failed, 4 skipped**; honest fallback after provider 503 |

The new provider tests cover stateless Interactions requests, structured output, low thinking, output bounds, cancellation, no retries, all incomplete interaction statuses, safe provider failures, and explicit older-model overrides without automatic model switching. Browser interaction regressions verify the longer request deadline and cancellation without saving changes. Mocked successful SDK responses remain mocked evidence only.

## Gemini configuration and targeted repairs

The centralized default is **`gemini-3.8-flash`**, as explicitly requested. The model, thinking levels and structured JSON support were checked against [Google's current model guide](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.8) and [structured-output documentation](https://ai.google.dev/gemini-api/docs/structured-output), together with the installed SDK declarations and implementation.

The default now uses `GoogleGenAI.interactions.create`: `store: false`, `stream: false`, `thinking_level: low`, 5,000 output tokens, the operation's JSON schema, a 60-second abort deadline and `retries: { strategy: "none" }`. It sends no previous interaction ID, tools or agent configuration. Only the selected synthetic/current event context and its bounded question are sent. An explicit alternative Gemini model keeps the existing `models.generateContent` path; failed calls never trigger another model or provider request. JSON is still parsed, Zod-validated and checked against actual category keys before receiving a live source label.

Vercel metadata confirms `GEMINI_API_KEY` is a **sensitive Secret scoped only to production**. Its value was not decrypted, printed, copied to preview/local or committed. No `GEMINI_MODEL` override is configured on Vercel. Secret presence does not establish account eligibility, quota or successful inference.

The earlier 20-second provider and 28-second client deadlines proved insufficient. They are now 60 seconds for the provider, 70 seconds for browser/smoke HTTP and 75 seconds for the server route. User cancellation remains available. Neither SDK nor smoke runner retries automatically. The smoke configuration also avoids an extensionless-import warning from Vite's future configuration loader.

## Actual live-provider evidence

All calls used synthetic events through the actual Eventura API and did not access browser-local records. Every live run stopped at its first failed scenario.

Earlier legacy-endpoint attempts on 24 October failed after 20.007 seconds, then returned provider HTTP 503 after 1.711 and 5.381 seconds. On 25 October, a wedding preflight timed out at 20.224 seconds; the increased-deadline wedding run timed out at 60.213 seconds, and the separately authorized short contextual question timed out at 60.390 seconds.

After switching to the current documented Interactions API, the exact production build `bdc4c63` was tested again:

| Operation | Actual live result | Actual no-key local production result |
| --- | --- | --- |
| A: Wedding recommendations | **Failed in 3.696 s**; API returned labelled fallback; production runtime logged provider HTTP **503** | Passed; `rule-based`, 4 context clues |
| B: Birthday recommendations | Skipped after A failed; live inference unverified | Passed; `rule-based`, 4 context clues |
| C: Community recommendations | Skipped after A failed; live inference unverified | Passed; `rule-based`, 4 context clues |
| D: Contextual question | Earlier request timed out; skipped in latest run | Passed; `rule-based`, 3 context clues |
| E: Protected optimization | Skipped after A failed; live inference unverified | Passed; `rule-based`, 3 context clues; protected amounts/exact total/reserve verified |

The safe production warning contained only reason `unavailable`, status `503` and allowlisted/unknown error type. No provider message, prompt or credential was logged. This establishes failure of the tested request, not a global Gemini outage or a proven diagnosis of the account. Two of the six additionally authorized requests were used; the other four were not spent after the renewed 503. There are **zero verified successful live Gemini operations**.

After provider availability recovers, an authorized maintainer can run the five-case smoke test against this production URL with `AI_SMOKE_URL`, `AI_SMOKE_ALLOW_REMOTE=1` and live mode. Stop after the first failure. Do not run live tests in ordinary builds or tests, paste a key into chat or repeatedly issue paid requests against an unchanged failure.

## Fallback, workflow and financial integrity

All five actual local API scenarios passed at `http://127.0.0.1:3044`, with no key and no mocked HTTP responses. Each response was structurally validated and labelled `rule-based`. Recommendations reflected category context, and synthetic inputs remained unchanged.

The protected optimization case retained the locked catering amount, produced non-negative integer rupees summing exactly to **₹1,80,001**, and enforced reserve of at least **₹18,001**. Validation did not persist a proposal. The deterministic optimizer, independent acceptance validation, acknowledgement, rejection behavior and preservation of timeline/vendor progress remain covered by the full automated suite. AI supplies guidance weights, never authoritative final amounts.

The original [24 October browser audit](PHASE4_REPORT.md) records actual local and hosted wedding, birthday and community creation, status updates, reload persistence, ideas without duplicate saves, contextual questions, protected comparisons, rejection, confirmed acceptance, mobile layout and recovery paths. Those observations belong to that audited fallback release. **A new final visual/browser check was skipped at the user's explicit request.** Current automated or HTTP checks are not described as fresh manual browser verification.

## Security and HTTP checks

- Server-only key configuration and provider modules retained; no public Gemini key variable. Credential-pattern scans found no matches in tracked files or all 18 locally built browser chunks.
- Anonymous HTTP checks of both current hosted addresses and the local build returned **200** for landing, saved events, wizard and dashboard route shells. These checks do not prove browser-local event creation or persistence by themselves.
- Invalid synthetic requests returned **400**, cross-origin browser requests **403**, with `Cache-Control: no-store`. They were rejected before contacting Gemini.
- All 9 landing script assets at each checked origin returned 200, with no Gemini credential/private-key patterns or public Gemini key variable. This is a scoped exposure check, not a guarantee against every possible secret format.
- Existing limits remain: 64 KiB streaming request body, 5-second body read, 1,000-character question, bounded arrays/strings, 24,000-character provider output and strict schema/semantic validation.
- Throttling is best-effort **30 requests/minute per server instance**, not a global or authenticated abuse-control boundary. API access is public; provider spending controls remain appropriate.
- Browser storage remains origin-specific version 1 (`eventura-ai:v1:events`), without cross-device sync, encryption, transactional multi-tab writes or backups. There are no live prices, verified availability, bookings or payments. Provider cancellation cannot guarantee cancellation of already-started billing.

## Repository size and public access

Measured at runtime commit `bdc4c63`, before the final small documentation changes:

| Measurement | Observed value |
| --- | --- |
| Tracked source/assets | **100 files; 4,426,634 bytes** |
| Unique historical blob contents, all local refs | **5,435,800 uncompressed bytes** |
| Existing Git loose-object storage | **4,083 KiB**; no packs |
| Fresh read-only all-refs pack estimate | **3,100,701 bytes** |
| Unauthenticated GitHub API storage estimate | **3,112 KiB**; may lag pushes |

These are distinct measurements and all remain below the **10 MB** competition limit. Final documentation adds one small report and edits existing Markdown; the final source/object measurements are retained outside Git with the audit artifacts. The largest existing asset is `public/logo.png` at 984,593 bytes. The official branding assets were preserved, including the SVG with embedded image data. No history rewrite or destructive cleanup was needed. Git reported one zero-size worktree metadata garbage entry; no metadata was deleted.

Unauthenticated GitHub API access returned **200**, `private: false`, default branch `main`. An anonymous raw-file request to the complete feature branch returned 200 and confirmed the stateless Interactions implementation. The complete submission must use the feature-branch link above: current default main is not the complete planner/assistant release.

Dependencies, `.next`, environment secrets, screenshots, verification artifacts and demonstration media remain outside tracked source. The sample environment file contains a blank key. Size artifacts and source-hash comparisons are stored outside the repository.

## Deployment, local server and demonstration

Vercel project `eventura-ai`, production deployment **`dpl_3hz3vz8WfhZL1BfuDXYGC7jdT6LS`**, reached **READY** with exact commit `bdc4c63`, Node 24, the Next.js preset, `npm ci` and `npm run build`.

- [Immutable verified release](https://eventura-elzk1uzwl-bharath0757s-projects.vercel.app)
- [Stable application](https://eventura-ai.vercel.app)
- Local production: `http://localhost:3044`, intentionally configured without a key; server started successfully and HTTP/fallback checks passed.

The stable alias currently serves this release. A subsequent automatic deployment from default main can replace it; the immutable link identifies the tested version. Main's production-branch settings were not silently changed. No shared process was terminated to start the isolated local server.

The existing [115-second demonstration](https://drive.google.com/file/d/1eZxlgrBhcgzOtKNx_o6jMM_4rRk9JKAr/view) remains the externally hosted, previously verified deliverable. It is a silent captioned walkthrough assembled from unaltered actual-app screenshots with synthetic events and clearly labelled fallback, not a continuous screen recording or live Gemini demo. Its original anonymous Drive viewer/media access and playback were verified on 24 October; this release did not repeat a visual check or upload a fabricated live demonstration. [DEMO_PLAN.md](DEMO_PLAN.md) retains the narration plan.

## Final assessment

**Ready for an honestly labelled fallback competition demonstration.** The complete implementation is public on the designated branch, prior history and parallel branding work are preserved, available checks pass, exact protected accounting is verified, the app is deployed, repository measurements support the size limit and the video is hosted outside Git.

**Live Gemini remains the outstanding provider-dependent verification item.** HTTP 503/timeouts are documented rather than claimed as success. Phase 4's stated completion criteria permit explicitly blocked live verification; this report does not certify all five real-provider operations or the final visual review that the user chose to skip.
