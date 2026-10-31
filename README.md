# Eventura AI

**Your vision. Your budget. Your occasion, beautifully planned.**

Plan weddings, birthdays and community gatherings with an exact INR budget, dated milestones, vendor checklists, personalized ideas and practical contingencies. Eventura creates a transparent starter plan, saves progress in your browser and offers optional Gemini guidance that you review before applying.

[Open Eventura](https://eventura-ai.vercel.app) · [Default main branch](https://github.com/bharath0757/Eventura-AI/tree/main) · [Quality and performance evidence](docs/performance-quality.md) · [Requirements matrix](docs/problem-alignment.md)

## Run locally

Use Node.js 24 and the committed npm lockfile:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Use `npm run dev -- --port 3038` if that port is occupied. For a production build:

```sh
npm run build
npm start
```

The planner works without an account, database or API key. For optional live assistance, create a server-only `.env.local` using [.env.example](.env.example) and configure `GEMINI_API_KEY`. Preserve an existing environment file rather than overwriting it. `GEMINI_MODEL` is an optional override; the default is `gemini-3.8-flash`. Restart the server after changing configuration. Never commit credentials or expose them through a `NEXT_PUBLIC_` variable.

## Planning journey

1. Choose an occasion; the four-step wizard opens with its category selected.
2. Enter the date, location, guest count, category preferences, budget and one to three priorities.
3. Review the brief and create the event.
4. Inspect the dashboard, update milestone/vendor statuses and reopen the plan from My events.
5. Deliberately request ideas, a contextual answer or a budget proposal. Keep an idea or confirm a reviewed proposal to save it; rejecting a proposal leaves the budget unchanged.

The interactive sample uses the same canonical planner as saved events. Its progress is temporary and downloadable; it never writes into My events. Checklist entries are suggestions, not bookings or live vendor quotations.

## Planning guarantees and limits

- Allocations are integer rupee amounts and sum exactly to the total. Largest remainders resolve rounding reproducibly.
- Category profiles total 100%, including a 10% contingency profile. Starter allocation rounding remains compatible with existing records.
- Optimization preserves protected amounts and reserves at least `ceil(targetBudget / 10)`. Infeasible constraints are rejected.
- Proposal acceptance recomputes financial values against the latest saved context and preserves task progress and preferences.
- Date-only arithmetic avoids time-zone shifts. Past recommended deadlines remain visible while actionable dates move to the planning reference day.
- Runtime schemas validate briefs, plans, stored records, assistant requests and output. Failed persistence does not report success.

| Input                         | Supported range                                |
| ----------------------------- | ---------------------------------------------- |
| Budget                        | Integer INR, ₹1,000–₹10,00,00,000              |
| Guests / volunteers           | 1–1,00,000 guests; 0–1,00,000 volunteers       |
| Priorities                    | One to three distinct choices for the occasion |
| Name / location               | 80 / 120 characters                            |
| Dietary / accessibility needs | 500 characters each                            |
| Notes / assistant question    | 1,000 characters each                          |

Costs are planning estimates; confirm actual prices and arrangements with providers. Unsubmitted wizard and assistant drafts, including edits made to invitation text, do not survive a refresh. Submitted Utsav conversations do.

## Privacy and persistence

Events use version-1 browser-local storage under `eventura-ai:v1:events`. They do not synchronize across devices or origins, and clearing site data removes them. Invalid individual records are hidden with a warning and preserved during valid writes. Denied, full or corrupt storage produces a recoverable error.

Only an explicit assistant action sends the selected event's brief, current plan, preferences and relevant question or constraints to the server and, when configured, Google Gemini. Other saved events and the storage envelope are not sent. Utsav sends the current message and up to eight recent messages from only the selected conversation, plus its validated event context when selected. Opening a page or loading the assistant makes no provider request. The application does not log raw prompts, responses or credentials.

The official Google SDK is server-only. Requests are stateless (`store: false`), bounded and use one attempt. Validated live output is labelled **AI-generated · Live Gemini**; missing configuration, provider failures and unusable output return clearly labelled **Rule-based fallback**. Neither mocked tests nor fallback responses establish successful live inference. The bounded model comparison stopped after two failures and did not justify switching the default; details are in the [quality report](docs/performance-quality.md).

The API validates origin, content type, body size and contracts, with `no-store` responses and a best-effort per-instance request limit. This prototype has no authentication, external database or distributed rate limiter. Browser-local storage is not transactional across simultaneous tabs; people sharing a browser profile can access its local plans.

## Utsav celebration companion

Open the ivory-elephant launcher on any page for general planning or a selected saved event. Event dashboards automatically select their own conversation. Utsav supports follow-up questions, local next-three priorities, editable invitation drafts with a copy action, personalized ideas and the existing protected-budget review. Budget changes still require explicit confirmation. Free-form messages cannot modify plans or contact anyone.

The welcome character uses wedding marigolds, birthday coral ribbons or community green leaves. The panel and its illustrations load only after opening. Keyboard users can close with Escape and return to the launcher; reduced-motion preferences disable animation.

Histories live separately under `eventura-ai:utsav:v1:threads`, with the latest 50 messages per conversation and a 1 MiB total bound. Clear chat removes only the selected conversation. Storage errors leave the open conversation usable with a warning. Deleting an event does not delete its separate chat history; clearing site data removes all local event and chat data. Histories do not synchronize between devices. People sharing a browser profile can read them.

See the [Utsav verification report](docs/utsav.md) for release checks, live-provider limitations and generated-asset provenance.

## Verification

Ordinary checks require no credentials and reject accidental external AI requests:

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npx playwright install --with-deps --only-shell chromium
npm run test:e2e
```

The browser suite owns an isolated production server at `127.0.0.1:3046`. It checks all three occasion flows on desktop and mobile, persistence, protected budget previews/acceptance/rejection, honest fallback and failure recovery. Accessibility cases inspect wizard steps, dashboard panels, assistant results and sample tabs, including keyboard focus and download contents.

Coverage gates protect critical business logic; optimizer and storage retain 100% line/function requirements. Coverage is scoped to the modules listed in [the testing guide](docs/testing.md), not the entire UI or the live provider. GitHub Actions performs clean installs, formatting, lint, types, coverage, build and browser checks without production credentials.

The separate [performance guide](docs/performance-quality.md) describes the numeric baseline, route measurements and mobile Lighthouse budgets. Its targets are laboratory checks, not a promised competition score. Use the report for current results and any remaining verification limits.

Live verification is opt-in: `npm run ai:smoke` and the explicitly enabled `npm run ai:compare` use synthetic events, can consume provider quota and stop after failure. They are excluded from ordinary tests and CI. Follow the runner configuration in the testing/quality guides before invoking them.

## Code map

| Area                                         | Responsibility                                                                               |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/app/`                                   | Server-rendered landing, route-specific styles and assistant API boundary                    |
| `src/components/wizard/`                     | Focused wizard steps and creation/validation lifecycle                                       |
| `src/components/dashboard/`                  | Plan sections and stable loading geometry                                                    |
| `src/components/assistant/`                  | Deferred loading, cancellation, context invalidation and deliberate persistence              |
| `src/components/use-events.ts`               | Cached `useSyncExternalStore` snapshots, cross-tab subscriptions and mutation-result updates |
| `src/lib/planner/`                           | Canonical profiles, exact allocation and shared timeline/vendor builders                     |
| `src/lib/validation/` and `src/lib/storage/` | Versioned contracts and validated browser persistence                                        |
| `src/lib/ai/`                                | Provider adapter, bounded output, deterministic optimization and labelled fallback           |
| `tests/`, `e2e/`, `scripts/`                 | Regressions, browser accessibility and numeric performance evidence                          |

Static landing content and sample-plan generation stay on the server; small client components handle interactions. The sample dialog and optional assistant load when needed. Event routes use cached validated snapshots, and successful mutations reuse returned records without a second full read/validation/sort. Task progress changes invalidate older advice.

Runtime: Next.js 16.4.3, React 19.3.1, TypeScript, Tailwind CSS 4, Lucide, Zod and the official Google GenAI SDK. Exact versions are recorded in `package-lock.json`. Read [AGENTS.md](AGENTS.md) and the installed Next.js guides before framework changes.

## Evaluation and demonstration

Evaluate the default main branch so the complete application, tests and CI are included. Exclude `node_modules`, `.next`, environment files and generated reports from source submissions. Current release evidence belongs in the [quality report](docs/performance-quality.md).

The [115-second captioned walkthrough](https://drive.google.com/file/d/1eZxlgrBhcgzOtKNx_o6jMM_4rRk9JKAr/view) uses synthetic records and clearly labelled fallback from the earlier release. It is a silent captured-screen walkthrough, not a continuous recording or verified live-Gemini demonstration. [Demo notes](DEMO_PLAN.md) describe its scope.

Historical evidence: [testing audit](docs/testing-audit.md), [remediation report](docs/remediation-report.md), [Gemini 3.8 report](GEMINI38_REPORT.md), [Phase 4 audit](PHASE4_REPORT.md), [Phase 3 report](PHASE3_REPORT.md) and [initial implementation report](IMPLEMENTATION_REPORT.md).

Bundled photos are credited to Unsplash: [wedding](https://images.unsplash.com/photo-1519225421980-715cb0215aed), [birthday](https://images.unsplash.com/photo-1530103862676-de8c9debad1d), [community gathering](https://images.unsplash.com/photo-1511795409834-ef04bbd61622). The original MIT license and Git history are preserved.
