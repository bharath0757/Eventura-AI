# Eventura AI — Phase 4 release verification

Verified on **24 October 2026** using Node.js **24.19.0**, Next.js **16.4.3**, the installed Google GenAI SDK **2.31.0**, and the existing npm lockfile. This is a release audit and targeted repair of the committed application, not a rebuild of the previous phases.

## 1. Branch and commit state

The verified implementation is in `C:\Users\BHARATH\.codex\worktrees\eventura-ui-redesign\Eventura AI`, on `codex/eventura-ui-redesign`, based on **8374316d019d9d214e0f176d64f362a47e273343**. Its Phase 3 commit and all earlier history remain intact. The remote is the intended `https://github.com/bharath0757/Eventura-AI.git`.

The shared `D:\Eventura AI` checkout is still the earlier `main` checkout with pre-existing uncommitted work. It was inspected and left in place; no Phase 3 files were copied over it. After the user explicitly authorized publication and deployment, Phase 4 was committed as **88ecca1693f49a784818ebfd4ff98dd79dfafa22** and pushed normally to `origin/codex/eventura-ui-redesign`, without conflicts or rewriting remote changes. Final documentation follows that code release. No cherry-pick, merge, rebase, reset, force-push, worktree deletion or duplicate Phase 3 commit was performed.

The initial worktree had only a generated `next-env.d.ts` development-type path change. Its original contents and initial diff were preserved outside Git before verification. Next's production build regenerated its production typing references. The user's port-3000 application and real event session were not used for synthetic testing.

## 2. Actual automated results

| Check | Baseline | Final result |
| --- | --- | --- |
| `npm test` | 222 passed, 8 files | **235 passed, 10 files** |
| `npm run lint` | Passed | Passed |
| `npm run typecheck` | Passed | Passed |
| `npm run build` | Passed | Passed, including API and event route generation |
| `git diff --check` | Passed | Passed; expected Windows line-ending notices only |
| `npm audit --omit=dev --json` | Inspected | **0 production vulnerabilities** |

The final full suite includes every original Phase 3 test. The 13 added cases cover smoke-fixture validation, source honesty, exact protected proposals, recommendation context clues, missing/corrupt dashboard state, assistant failure without losing ordinary task controls, and rejected stream cancellation during body timeout. Ordinary tests and builds make no live provider requests.

### Reproduced and repaired issues

- **Timeout cleanup:** the new stream-cancellation regression reproduced an unhandled rejected promise from a producer's `cancel()` method. The targeted run exited with one unhandled error. The timeout cleanup now catches this cleanup failure and retains the safe HTTP 408 outcome. The same regression and full suite subsequently passed without unhandled errors.
- **Budget FAQ:** the landing FAQ incorrectly advised creating a new event for every budget change. It now describes the existing protected preview/confirmation workflow and reserves new-event creation for other brief changes.
- **Toolchain instructions:** README now recommends the tested Node 24 LTS toolchain. Next's 20.9 minimum is distinct from installed Vite 8.3.5's `^20.19.0 || >=22.12.0` requirement. No unrelated runtime or dependency upgrade was introduced.

## 3. Live Gemini smoke-test results

`GEMINI_API_KEY` was checked without revealing its value and is **not configured** in the tested worktree or shared project. `GEMINI_MODEL` has no local override. The centralized `gemini-3.5-flash-lite` default remains unchanged: its current [official model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) lists structured-output support. The [official structured-output documentation](https://ai.google.dev/gemini-api/docs/structured-output) and installed SDK definitions were reviewed for the existing `models.generateContent`, JSON schema, cancellation, timeout and retry APIs.

Added `npm run ai:smoke`, using the existing Vitest tooling in a separate configuration. The command is not included in unit tests or builds. It sends synthetic requests through the actual Eventura API, validates the returned contracts and source, checks recommendation context clues, independently checks budget amounts/locks/reserve and validates the proposal without invoking persistence. It never loads browser-local user events.

| Scenario | Real Gemini result | Actual local fallback API result |
| --- | --- | --- |
| A: Wedding recommendations | **Blocked — missing key** | Passed; source `rule-based`, 4 context clues |
| B: Birthday recommendations | **Blocked — missing key** | Passed; source `rule-based`, 4 context clues |
| C: Community recommendations | **Blocked — missing key** | Passed; source `rule-based`, 4 context clues |
| D: Contextual question | **Blocked — missing key** | Passed; source `rule-based`, 3 context clues |
| E: Protected budget optimization | **Blocked — missing key** | Passed; exact ₹1,80,001 proposal, protected food and reserve checks |

The actual final commands were `npm run ai:smoke` (five skipped/blocked, zero live requests) and `AI_SMOKE_MODE=fallback` with `npm run ai:smoke` (five passed against the running production API). A zero process exit with skipped cases is explicitly **not** a successful live result. Mocked SDK success is also not presented as live verification.

The smoke runner loads production environment files, including `.env.local`, without printing credentials. It makes sequential requests with a 28-second timeout; after the first failure it skips remaining cases to avoid repeated failed paid requests. Remote endpoints require explicit opt-in, and credentials in URLs are rejected. Context-clue checks help identify generic content but do not guarantee recommendation quality; a real response still needs review.

To unblock live verification, put a valid key directly in the server's `.env.local` or authorized Vercel secret settings, preserve other environment values, restart/redeploy, and run the smoke command. Never paste the key into this conversation. Account quota, billing eligibility, real model availability and generated quality remain unverified.

## 4. Fallback verification

All five synthetic smoke scenarios passed through the **actual local production API** at `http://localhost:3044` and, after authorized deployment, through the **actual hosted API** at `https://eventura-mp2ge4fjy-bharath0757s-projects.vercel.app`, without mocking the HTTP response. Output was honestly marked rule-based. No saved record was read or written by those tests. Hosted results were A–C: four contextual clues each; D–E: three each, with five passed and zero failed.

The browser also requested and rendered tailored fallback recommendations for all three categories. Wedding guidance used the garden theme, 120 guests, dietary preference and selected priorities; birthday guidance used a dinosaur craft party and 30 guests; community guidance used a repair workshop, 80 attendees and 12 volunteers. A contextual answer listed the unfinished due milestone while excluding an already-completed task.

Authentication, quota, provider network, timeout, empty/malformed/truncated output and invalid category guidance were exercised at the mocked SDK boundary by the existing suite. A failed assistant fetch was additionally tested in the full dashboard, where the budget remained visible and task progress could still be saved. No real provider outage was manufactured, and these cases are not described as manual Gemini tests.

## 5. Browser verification

A browser-driven walkthrough exercised the **actual production build**, on a separate origin from the user's port-3000 session. All events below are synthetic and dated 1 January 2027, which was in the future on the audit date.

| Journey | Observed evidence |
| --- | --- |
| Landing | Loaded at desktop and mobile sizes; occasion actions opened the wizard |
| Wedding creation | Four steps completed; fusion garden ceremony, 120 guests, ₹2,40,001, Food quality/Photography, dietary/access requirements |
| Birthday creation | Four steps completed; children, dinosaur crafts and activities, 30 guests, ₹45,001 |
| Community creation | Full wizard completed on mobile; repair workshop, 12 volunteers, 80 guests, ₹60,001 |
| Generated plans | Expected budgets, timelines, vendors, ideas and risk sections present; birthday had 6 timeline tasks/4 vendors/6 ideas/3 risks; community had 6/6/9/4 |
| Exact budget totals | Rendered allocations independently summed to ₹2,40,001, ₹45,001 and ₹60,001; proposed wedding allocations summed to ₹1,80,001 |
| Task progress | Wedding timeline task completed and catering task marked in progress; both survived reload |
| Ideas | Generated for all categories; a wedding idea retained; regenerating kept one retained idea and disabled its duplicate save action |
| Contextual question | Returned the next unfinished wedding milestone with its due date, reflecting current progress |
| Protected comparison | Wedding target ₹1,80,001 retained catering at ₹72,001; reserve ₹18,001; integer amounts and signed differences displayed |
| Rejection | Saved wedding total stayed ₹2,40,001 after rejection |
| Explicit acceptance | Save button was disabled until acknowledgement; acceptance saved ₹1,80,001; reopened event retained statuses and the saved idea |
| Mobile comparison | Community target ₹50,001 retained equipment ₹12,000 and reserve ₹5,001; rejected proposal left the saved ₹60,001 intact |
| Saved navigation | All three occasions appeared in My events with correct amounts and progress |
| Recovery | Missing UUID and malformed event ID showed Create an event / Return to my events; an incomplete wizard showed field errors and focused the missing name |
| Layout | Desktop content/scroll widths 1265/1265; mobile 375/375 within the requested 390-pixel viewport; checked landing, community wizard, dashboard and assistant comparison |
| Browser errors | Error log empty during the walkthrough; temporary viewport override reset |

Corrupt localStorage recovery and provider failure were verified with component/unit tests rather than mutating the user's browser storage. The production browser walkthrough and automated tests are separate evidence. Screenshots are stored outside the repository, including `saved-events-desktop.png` and `community-mobile.png` in the Phase 4 verification artifacts folder.

The deployed origin was then independently exercised through its actual UI. A new synthetic wedding, birthday and community workshop were created through the complete wizard. The wedding used ₹2,40,001, the birthday ₹45,001 and the community event ₹60,001, with exact allocation sums. Wedding milestone completion, catering progress, tailored fallback recommendations, duplicate idea prevention and the contextual weekly question worked. A ₹1,80,001 proposal protected catering at ₹72,001 with a ₹18,001 reserve; rejection retained ₹2,40,001, while acknowledgement plus confirmation saved ₹1,80,001. Reload preserved the completed milestone, catering progress and one kept idea. The mobile workshop used 12 volunteers, showed a valid ₹50,001 comparison with Equipment protected at ₹12,000 and reserve ₹5,001, and rejection/reload retained ₹60,001. Mobile content measured 375 px wide with 375 px scroll width. All three cards appeared in My events. Missing valid UUID and malformed IDs showed recovery links, landing images loaded, and captured browser error logs were empty.

## 6. Security and financial audit

- The key is accessed only from server-only configuration/client code; no `NEXT_PUBLIC_GEMINI_API_KEY` use was found. Provider errors map to safe messages. Current source and reachable historical text blobs were scanned for common credential/private-key patterns with **zero matches**; suspicious values were never printed. Such a scan complements review and cannot prove the absence of every possible secret format.
- The route validates JSON media type, streaming body size (64 KiB), bounded instructions (1,000 characters), canonical event/plan invariants and operation-specific fields. Requests have a five-second body timeout. Provider output is bounded by strict Zod schemas, 24,000 characters and 5,000 tokens. Unknown actions and category references are rejected.
- SDK calls use a 20-second timeout, supported abort signal and `attempts: 1`. Generation is on demand. Neither the API nor the smoke runner logs complete event records, secrets or prompts. Cancellation cannot guarantee cancellation of provider-side computation or billing already started.
- The 30-requests/minute in-memory counter is shared by one instance, not a reliable global limit across serverless instances or restarts. Origin checks are a browser safeguard, not authentication. Identity-aware/distributed throttling and provider spending limits remain production considerations.
- The financial engine remains deterministic. AI actions influence validated integer weights; they do not supply authoritative currency amounts. Protected amounts, exact target totals, integer allocations, category identity and the minimum reserve are enforced. Acceptance recomputes the proposal against the latest saved record and validates before persistence. Tests cover infeasibility, stale/altered proposals, failed writes and preservation of unrelated task statuses.
- Browser-local persistence remains unencrypted, origin-specific and unsynchronized, with no transactional coordination for simultaneous tabs. No bookings, payments, live vendor prices or verified availability are implied.
- The production-only dependency audit returned zero vulnerabilities. The existing installation's development-tooling advisories were not addressed with an unrelated force-upgrade.

## 7. Repository-size measurements

The competition threshold is **10 MB**. Measurements included all local refs and reachable history rather than just the current source folder.

| Measurement | Actual result |
| --- | --- |
| Initially tracked working files | 85 files, **998,655 bytes** at the initial measured state |
| All-ref reachable Git objects | **233 objects, 2,504,041 uncompressed bytes** |
| `git count-objects -vH` | 245 loose objects; **1023.03 KiB** loose storage; 0 packs; 0 bytes packed |
| Read-only all-ref pack estimate | **559,310 bytes**, `git pack-objects --all --stdout`, no history/storage rewrite |
| GitHub API reported repository size | **494 KB**, unauthenticated public metadata |

The largest tracked files were the lockfile (~319 KB in the working copy), wedding photo (188,580 bytes), community photo (80,149 bytes), birthday photo (65,005 bytes), and CSS. Historical large blobs were primarily earlier lockfiles; none approached the threshold. Git noted a pre-existing zero-byte worktree-metadata warning; it was preserved rather than deleting a worktree or rewriting history.

At published code release `88ecca1`, tracked source measured **92 files / 1,041,538 bytes**, all-ref history measured **254 objects / 2,574,497 uncompressed bytes**, loose object storage was **1.03 MiB** with zero packs, and the read-only all-ref pack estimate was **578,511 bytes**. GitHub still reported **494 KB** shortly after publication; this metadata can lag a push. These supporting measurements remain below 10 MB without any history rewrite.

Final working source including nonignored Phase 4 files: **1046692 bytes**. This value excludes `.git`, dependencies, build output, screenshots, the video encoder and the externally hosted 1.47 MB demonstration MP4. Source size, uncompressed historical object size and compressed pack estimate are distinct measurements. New release files are small source/tests/documentation; no history cleanup was necessary.

## 8. Public GitHub status

Unauthenticated HTTP requests returned **200** for both the public repository page and GitHub repository API. API fields were `private: false`, `visibility: public`, `default_branch: main`, `size: 494`. After the authorized release push, the submission branch commit API also returned 200 and exact code-release commit **88ecca1693f49a784818ebfd4ff98dd79dfafa22**.

Verified repository: [bharath0757/Eventura-AI](https://github.com/bharath0757/Eventura-AI). Verified complete implementation branch: [codex/eventura-ui-redesign](https://github.com/bharath0757/Eventura-AI/tree/codex/eventura-ui-redesign).

**Submission caveat:** default `main` is older than the complete feature branch. Supply the complete branch link for review. Phase 4 code is now published there, followed by this release documentation. No remote changes were overwritten and Phase 3 was not merged a second time.

## 9. Deployment status

Initially no `.vercel/project.json` or matching Vercel project existed. After explicit user authorization, a new `eventura-ai` project was created in the connected team and commit `88ecca1` was deployed with Node 24, the Next.js preset, `npm ci` and `npm run build`. Deployment **dpl_HzotybGap4GoRN3MTJkGzA8rXzLA** reached **READY**, with its returned metadata identifying the correct GitHub repository, branch and exact commit. Vercel assigned this first build as the new project's primary deployment; it did not replace an existing deployment.

Verified public URLs: [immutable audited build](https://eventura-mp2ge4fjy-bharath0757s-projects.vercel.app) and [stable app address](https://eventura-ai.vercel.app). Both returned unauthenticated HTTP 200 and the correct page title. The local production preview remains `http://localhost:3044`, and the existing development server remains on port 3000; both also returned HTTP 200. No Gemini secret was configured or exposed. The README links the [current Vercel environment documentation](https://vercel.com/docs/environment-variables/managing-environment-variables) for future server-only key configuration.

The five hosted fallback API scenarios and three-category hosted browser journey passed as described above. Anonymous page/script checks covered landing, saved events, creation and dashboard routes: all 15 distinct script chunks returned 200, with no Gemini key variable names or provider SDK endpoint implementation found. Local scanning separately covered all 18 production chunks. Live Gemini on the host remains explicitly blocked by the missing key, rather than being inferred from fallback success.

## 10. Remaining blockers and deliverables

| Item | State / next concrete step |
| --- | --- |
| Live provider verification | Blocked by missing key; configure locally/securely, restart and run `npm run ai:smoke` |
| Public application | Deployed and publicly verified; exact code-release commit and URLs recorded above |
| Phase 4 publication | Authorized, committed and pushed normally to the complete feature branch |
| Competition branch | Complete Phase 3 is public on the feature branch; default main is older |
| Demonstration | Reviewed 115-second captioned actual-app walkthrough uploaded and shared on Drive after explicit authorization; anonymous viewer/media access verified |

README now documents the problem, tagline, three categories, Adaptive Event Plan, deterministic accounting, protected optimization, privacy/local storage, safe setup, smoke commands, actual public branch, verified deployed app and live-provider limitation. The [hosted demonstration](https://drive.google.com/file/d/1eZxlgrBhcgzOtKNx_o6jMM_4rRk9JKAr/view) is a silent captioned walkthrough assembled from unaltered actual deployed-app screenshots, not a continuous recording. Its decoded duration is 115.00 seconds, with H.264 video at 1280×900 and a file size of 1,465,656 bytes. Drive permission metadata confirms `anyone` / `reader` / discovery disabled; unauthenticated requests returned 200 for its viewer and 206 for `video/mp4` media with a valid MP4 signature. The demo plan includes narration guidance if a continuous narrated take is required. The video, screenshots and encoder remain outside Git.

## 11. Competition-readiness assessment

**Published, deployed and verified for a truthful fallback demonstration.** All required available automated checks pass, the three event journeys were exercised in local production and on Vercel, financial constraints hold, public repository access is verified, and measured repository/history sizes are below 10 MB. The reviewed demo has an externally accessible viewer link. The small timeout repair is regression-tested, and previous-phase history and background work are preserved.

**Live Gemini is not verified.** The remaining configuration step is to set a valid key securely, redeploy and run the five live-provider smoke scenarios. The specification explicitly permits live verification to be documented as blocked. No mocked test, local build or rule-based response is represented as proof of a real Gemini call. Submit the complete feature-branch link, and check whether the competition requires a continuous narrated recording rather than the delivered captioned capture walkthrough.
