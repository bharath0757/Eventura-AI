# Eventura AI
**Your Vision. Your Budget. Your Perfect Event.**

A working Phase 2 competition prototype for weddings, birthdays and community events. Generate a transparent, rule-based starter plan with an exact INR budget, date-driven milestones, vendor checklist, personalized ideas and practical contingencies.

## Run locally
Use Node.js 20.9 or newer (verified with Node 24.19.0).
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
- There is no authentication, external database, Gemini integration, API key or external planning request in Phase 2. People using the same browser profile can access its locally saved events.

## Repository baseline
The supplied GitHub repository contained only its MIT license at commit `227841e2b65db2efe155cc5c5050abd9b1e1aaeb`. The Next.js foundation described in the brief was absent, so this implementation adds it without replacing application code. Original Git history and license are preserved.

Runtime: Next.js 16.4.3, React 19.3.1, TypeScript, Tailwind CSS 4, Lucide React, Zod 4 and Vitest 4.1.10. Exact resolved dependencies are recorded in package-lock.json.

Do not include node_modules, .next, logs, coverage or environment files in the competition source submission. See IMPLEMENTATION_REPORT.md for verification results and scope.
