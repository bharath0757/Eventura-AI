# Eventura AI
**Your Vision. Your Budget. Your Perfect Event.**

A working Phase 3 competition prototype for weddings, birthdays and community events. Generate a transparent, rule-based starter plan with an exact INR budget, date-driven milestones, vendor checklist, personalized ideas and practical contingencies.

Event planning spreads budgets, deadlines and supplier details across too many places. Eventura AI brings them into an **Adaptive Event Plan**: a deterministic starting plan with contextual recommendations, saved task progress and budget changes you can preview before approving. Gemini provides advisory guidance when configured; the application calculates and validates every monetary amount.

Public repository access was verified without authentication on 24 October 2026: [Eventura AI on GitHub](https://github.com/bharath0757/Eventura-AI). The completed Phase 3 implementation is on [codex/eventura-ui-redesign](https://github.com/bharath0757/Eventura-AI/tree/codex/eventura-ui-redesign) at `8374316`; the default `main` branch is older. Select the complete branch when reviewing or preparing a deployment. Phase 4 verification changes are local until publication is authorized. See [PHASE4_REPORT.md](PHASE4_REPORT.md) and the [110-second demonstration plan](DEMO_PLAN.md).

## Run locally
Use Node.js 24 LTS for the complete development and test toolchain (verified with Node 24.19.0). Next.js declares a 20.9 runtime minimum, while the installed test tooling has newer engine requirements.
```powershell
npm ci
npm run dev
```
Open http://localhost:3000. If that port is in use: `npm run dev -- --port 3038`.

Production:
```powershell
npm run build
npm start
```

Verification:
```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

## User journey
- Choose an occasion on the landing page; its category is prefilled at `/events/new?category=wedding|birthday|community`.
- Complete essentials, category-specific preferences, budget and priorities.
- Review or edit each section, then create the event.
- Open `/events/[eventId]` to review its plan and update timeline/vendor statuses.
- Revisit `/events` to reopen events or delete one after confirmation.

## Architecture
- `src/types/index.ts`: canonical TypeScript types inferred from the runtime schemas.
- `src/lib/validation/schemas.ts`: Zod validation for briefs, category-specific discriminated unions, plans and stored records. Creation requires today or a future date; historical saved events remain valid.
- `src/lib/dates.ts`: date-only calendar validation and arithmetic. Dates stay YYYY-MM-DD. UTC is used only for arithmetic and display of date-only values; the creation reference day comes from the user's local calendar.
- `src/lib/planner/profiles.ts`: category allocation profiles, milestone offsets and vendor templates. Change planning defaults here. Each profile totals 100%, including a 10% contingency.
- `src/lib/planner/index.ts`: React-independent deterministic planner. Integer products and largest fractional remainders allocate every rupee exactly; profile order resolves ties. Past recommended deadlines are retained but actionable deadlines move to the reference date.
- `src/lib/storage/events.ts`: injectable, validated localStorage persistence. Missing storage, malformed JSON, unsupported versions and write failures produce explicit errors. Invalid individual records are hidden with a warning and retained in the raw collection during valid writes.
- `src/components/`: reusable controls, four-step wizard, saved event cards, task controls and dashboard.
- `tests/`: validation, exact accounting, calendar arithmetic, planning and persistence regression tests.

## Limits and transparency
- Budget: integer INR from ₹1,000 to ₹10,00,00,000 (100,000,000). This cap keeps input practical and all allocation products safely within integer precision.
- Guests: 1–1,00,000; volunteers: 0–1,00,000, whole numbers only.
- Event name: 80 characters; location: 120; theme/style: 160; birthday activities: 300.
- Priorities: 1–3 distinct, category-appropriate choices.
- Dietary and accessibility requirements: 500 characters each; special instructions: 1,000.
- Amounts are planning estimates, not real vendor quotes or verified prices. The contingency reserve is part of the total, not additional money.
- Storage key: `eventura-ai:v1:events`; envelope and records have explicit version 1. Events remain only in this browser/origin. They do not sync across devices. Clearing site data removes them.
- The wizard preserves values while navigating its steps. Unsubmitted drafts are not saved across refreshes.
- There is no authentication or external database. Gemini requests are optional and initiated by the user from the selected event. People using the same browser profile can access its locally saved events.

## Repository baseline
The supplied GitHub repository contained only its MIT license at commit `227841e2b65db2efe155cc5c5050abd9b1e1aaeb`. The Next.js foundation described in the brief was absent, so this implementation adds it without replacing application code. Original Git history and license are preserved. Before publication, newer Phase 1 commits through abf249d were merged. Their reusable landing, layout and UI components, brand constants, utilities, environment example and agent guidance are retained. The active Phase 2 routes use the verified canonical data model and PostCSS build configuration.

Runtime: Next.js 16.4.3, React 19.3.1, TypeScript, Tailwind CSS 4, Lucide React, Zod 4 and Vitest 4.1.10. Exact resolved dependencies are recorded in package-lock.json.

Do not include node_modules, .next, logs, coverage or environment files in the competition source submission. See IMPLEMENTATION_REPORT.md for verification results and scope.

## Redesigned landing page
The landing page adds event photography, responsive occasion cards, FAQs, and an interactive illustrative sample. Its primary actions open the full Phase 2 wizard at `/events/new?category=...`; My events opens the existing saved-events collection at `/events`.

Landing styles are scoped to `.landing-site`, while the verified event application styles are scoped to `.event-app`. The `/events` layout retains the application header and footer. The canonical data model, exact budget calculations, dated milestones, persistence, and tests from Phase 2 are preserved. The sample preview uses separate session state and never writes to the saved-events collection.

Photographs are bundled in `public/images/` from Unsplash: [wedding](https://images.unsplash.com/photo-1519225421980-715cb0215aed), [birthday](https://images.unsplash.com/photo-1530103862676-de8c9debad1d), and [community gathering](https://images.unsplash.com/photo-1511795409834-ef04bbd61622).

## Phase 3: contextual assistance
Open a saved event and choose **AI assistant** in its section navigation. Get Personalized Ideas provides separate recommendations, risks and next actions. Keep this idea saves a validated idea with its source label; repeated saves are deduplicated and each event may retain 30 ideas. Ask Eventura AI accepts a question of at most 1,000 characters. Neither action changes the budget.

Optimize My Budget lets you enter a target, protect existing category amounts and explain priorities. Review every current/proposed amount, signed difference, reserve, rationale, alternative, trade-off and assumption. Check the acknowledgement and select **Confirm and save budget** to persist it. **Reject proposal** discards it. Changes to the budget or preferences invalidate an older proposal. Acceptance reads the latest saved event, preserving task progress, preferences, identifiers and timestamps of creation; it updates the modification timestamp and vendor planning allowances. Failed saves report failure and keep the stored record unchanged.

### Configure Gemini
1. Obtain a key through [Google AI Studio](https://aistudio.google.com/apikey) and review Google's data-use and billing terms for your account.
2. If `.env.local` does not exist, copy `.env.example` to it; otherwise preserve the existing file and edit only the required variables. Set `GEMINI_API_KEY` locally. Never commit it or use a `NEXT_PUBLIC_` prefix.
3. `GEMINI_MODEL` is an optional override. The centralized default is `gemini-3.5-flash-lite`, verified in the [official model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) on 2026-10-23. It supports structured output. Recheck availability before deployment; models can change.
4. Restart the server after environment changes. For deployment, enter the same server-side variables in the host's environment settings for the intended environment and redeploy. Do not embed values in source or build arguments that expose them to browsers.

Without a key, every ordinary planner interaction still works. Assistant requests return clearly labelled **Rule-based fallback** ideas, topic-based answers and deterministic proposals. Configuration, authentication, quota, network, timeout and invalid-output failures also fall back without retry loops. Successful validated Gemini responses display **AI-generated · Live Gemini**. Users may deliberately retry. Model availability, request quotas, free-tier eligibility and billing depend on the provider and account; no free quota is guaranteed.

### Data and provider boundary
Only a user-initiated assistant request sends the selected event's brief (including name, location, date, preferences and notes), current plan and relevant instruction/target/protected selections to the server and, if configured, Google Gemini. Nothing is sent on opening a dashboard. No unrelated events, storage envelope, saved AI history, credentials or record timestamps/UUID are sent. The UI discloses this before the request. Avoid entering unnecessary personal information in event notes. The application does not retain raw prompts or responses server-side or log event records. Provider-side retention is governed by your Google terms.

The official `@google/genai` SDK is imported only in `src/lib/ai/client.ts`, marked `server-only`. Configuration, prompts, validated services and API handling are separate from the React UI and financial engine. Structured JSON output is requested through `responseJsonSchema` and validated again with Zod, including actual category references. Responses with invalid fields, actions, categories, truncation or empty content are rejected. No provider tools, live vendor data, bookings, payments or external vendor calls are used. Obtain real quotations yourself before committing money.

### Deterministic optimization policy
All amounts are integer INR. Protected categories keep their current amounts exactly. The proposed reserve is at least `ceil(targetBudget / 10)` (10%), including when protected. This minimum is enforced for new proposals; legacy Phase 2 records remain readable even where rounding placed their original 10% allocation one rupee below that ceiling. An insufficient protected reserve or total is rejected, never silently changed.

After fixed protected amounts and the reserve are deducted, flexible non-reserve weights start from the existing event category's canonical profile percentages. Validated guidance applies integer multipliers: reduce=75, maintain=100, increase=125, review=100. Missing guidance uses 100. Divide the remaining total proportionally using exact BigInt products and Hamilton largest remainders; original plan order breaks ties. Percentage labels are separately apportioned to exactly 100. Financial results always sum to the target exactly. If the reserve is the only unlocked category, it absorbs any additional remainder. If every category is protected, there must be no remainder. Advice to reduce a protected category cannot override its lock. The preview explains advisory actions; actual amounts follow these deterministic constraints.

Before acceptance, the browser independently recomputes and validates the proposal against the latest saved brief and budget. The storage layer revalidates the full updated record before writing. Only optional `savedIdeas` metadata extends the version-1 record; old records without that field continue to load. Accepted proposals are not stored as pending plans, and rejected proposals never write to storage.

### Limits and production considerations
`POST /api/ai/plan` accepts JSON only: 64 KiB body limit checked during streaming, 5-second body-read timeout, 1,000-character instruction limit, bounded arrays/fields, 24,000-character provider output limit and 5,000 output tokens. Provider calls have a 20-second timeout and SDK cancellation, with one attempt. Browser requests time out at 28 seconds. Cancellation stops local handling; Google may still charge for provider work already started.

HTTP errors use structured codes: 400 invalid request/JSON, 403 cross-origin, 408 slow request, 413 oversized body, 415 content type, 422 infeasible budget, 429 request limit, 503 unexpected service failure. Provider failures normally return a successful, explicitly labelled fallback response. API responses are `no-store` and never include raw provider errors or prompts.

The in-memory 30-requests/minute cap is shared by an individual server instance, protecting against forwarded-IP spoofing without retaining identifying data. It is best-effort only: serverless instances/restarts each have separate counters, users share the local cap, and this is not global or enterprise-grade abuse prevention. Production should add an authenticated boundary, a distributed rate limit and provider spending controls. Browser-local storage is not transactional across simultaneous tabs/devices, backed up or encrypted; source context checks prevent stale budget approval within normal sequential usage, but simultaneous storage writes remain a prototype limitation.

### Verification
`npm test` runs the original planner/storage tests plus AI request/output, mocked official SDK, API, optimizer and React interaction tests. They never require credentials or make real provider calls. `npm run typecheck`, `npm run lint` and `npm run build` check the full application. See `PHASE3_REPORT.md` for actual final results and browser/live-provider verification boundaries. The existing `IMPLEMENTATION_REPORT.md` describes the earlier Phase 2 baseline.

## Repeatable API smoke checks

The smoke runner is separate from ordinary unit tests and builds. It uses five synthetic scenarios through the actual `/api/ai/plan` endpoint: wedding, birthday and community recommendations, a contextual question, and a protected budget proposal. It validates the response schema, honest source label, recommendation context clues, exact financial invariants and unchanged synthetic input. It never reads or writes browser-local saved events. Context-clue checks are a relevance signal, not a substitute for reviewing real generated advice.

Start a local production build in one terminal:
```powershell
npm run build
npm run start -- --port 3044
```

In another terminal, with a valid server-side `GEMINI_API_KEY` configured in `.env.local`:
```powershell
npm run ai:smoke
```

The runner loads production environment files with Next.js's environment loader, including `.env.local`; it never prints the key. Without a local key it reports **five blocked/skipped live scenarios and makes no API requests**. A green exit with skipped tests is not successful live verification. Restart the app after configuring the key. Do not paste credentials into chat, commit them or pass them in URLs. Model/account availability and quota must be checked with a real successful run; they were not established by the mocked tests.

To verify fallback against a server intentionally running without a key:
```powershell
$env:AI_SMOKE_MODE = 'fallback'
npm run ai:smoke
Remove-Item Env:AI_SMOKE_MODE
```

Set `AI_SMOKE_URL` for another port. Requests run sequentially with a 28-second timeout and no retries; after the first failure, remaining scenarios are skipped to avoid repeated failed provider calls. Output contains scenario names, source labels and counts rather than prompts, complete event records, credentials or raw provider errors.

Remote testing requires an explicit `AI_SMOKE_URL` and `AI_SMOKE_ALLOW_REMOTE=1`; use it only for an authorized deployment. The remote server holds its own credential, so no local key is required in this explicit mode. Never put credentials in the URL. Deployment-protected endpoints need an appropriate access flow before testing; this script does not bypass protection.

## Deployment and competition status

No `.vercel/project.json`, matching Vercel project, verified deployment URL or hosted demonstration video was available during this release audit. The connected personal account and available team were checked. Local production verification used `http://localhost:3044`; that is not a public deployment. Existing development usage on port 3000 was preserved.

To prepare an authorized deployment, import the verified repository into Vercel, select the complete implementation branch, use the Next.js framework preset and `npm ci` / `npm run build`, and review the resulting preview before any production promotion. Configure `GEMINI_API_KEY` as a server-side secret in the project's [environment settings](https://vercel.com/docs/environment-variables/managing-environment-variables); set `GEMINI_MODEL` only if overriding the supported default. Scope variables to the intended Preview/Production environments and create a new deployment after changes. No `NEXT_PUBLIC_` prefix is used. A key is optional for a fallback demonstration.

After deployment, rerun all five smoke scenarios and the browser journey on the actual returned URL. Verify mobile layout, saved-event navigation, fallback, errors and client bundles. Browser-local plans belong to an origin: localhost records do not automatically appear on a deployment or another device. Do not label a local production build as deployed, or fallback as live Gemini.

The public repository's tracked source, Git object storage, historical blobs and all-refs pack estimate were measured against the 10 MB competition limit; supporting measurements are in `PHASE4_REPORT.md`. Dependencies, build output, environment secrets, screenshots and videos remain excluded from the submitted source. Record the actual demonstration after review and host its video externally as described in `DEMO_PLAN.md`; no video link has been created or invented.
