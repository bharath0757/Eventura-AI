# Utsav implementation and verification

Utsav adds one global, deferred companion to Eventura. It preserves `/api/ai/plan` and the configured Gemini model, while `/api/ai/chat` accepts general or selected-event conversations. Opening a panel makes no provider call. Only an explicit send includes the current message, up to eight messages from that thread, and optional validated event brief/plan. Other events, saved ideas, storage envelopes and credentials are excluded.

## Product boundaries

- Wedding, birthday and community themes retain the approved ivory elephant identity.
- Conversation history is browser-local, separate from event v1 records, capped at 50 messages per thread and 1 MiB overall. Clear-chat actions are scoped to one thread. Storage failure preserves the current in-memory conversation with a warning.
- Ideas reuse the existing Keep this idea workflow. Budget previews reuse the existing protected allocations, exact sums, reserve and stale-context checks. Acceptance requires review and explicit confirmation.
- Next three priorities derive from unfinished saved timeline tasks without Gemini. Invitation drafts retain bracketed placeholders for missing details and allow editing/copying. Invitation edits are drafts; refresh restores the original generated text.
- Responses and history are rendered as text. Chat cannot execute actions, change saved events, contact vendors or send invitations.
- Switching conversations or closing the panel cancels pending chat. Updating event context invalidates pending advice. Dashboard and panel share validated local event snapshots.

## Verification

Formatting, lint, types, production build and scoped coverage are release gates. Unit coverage includes chat requests, provider failures/cancellation, safe local history, existing financial invariants and shared event snapshots. Browser cases retain the original three-occasion planning, ideas and confirmed budget workflows, and add continuity, eight-message request bounds, 50-message persistence, thread isolation, clearing, refresh, denied storage, cancellation, safe rendering, invitation editing/copying, honest fallback, keyboard focus, reduced motion and compact viewport checks.

The original performance gate remains unchanged. `scripts/utsav-performance-check.mjs` additionally compares all four routes at desktop/mobile sizes with `docs/performance-candidate.json`, the prior release measurement used for main `37b2eec698714d37d3c02ca90ac02cedf846e77f`. Added initial JavaScript must be at most 5,120 gzip bytes per route. Full panel dependencies, chat styles and optimized character images are deferred until opening.

Automated accessibility checks do not establish full assistive-technology certification. Compact viewport and visual-viewport handling are exercised, but real physical mobile keyboards have not been manually certified. The requested final manual visual review was omitted.

## Bounded live Gemini result — 31 October 2026

One synthetic general-planning request was made to the real local `/api/ai/chat` endpoint using the existing private configuration. The server-only SDK attempted the configured provider and reported HTTP **503** (`unavailable`). The application returned HTTP 200 with `source: rule-based`, a usable reply and the visible notice: “Live AI is temporarily unavailable. Utsav is using a rule-based reply.” Elapsed time was approximately 6.9 seconds.

Testing stopped after that first failure: **1 of at most 3 requests used**. Contextual follow-up and live invitation checks were not attempted. Mocked/browser checks do not prove successful live inference. No model was switched and no credentials were copied or logged. The integration is implemented; live Gemini success remains unverified because of the provider failure.

The opt-in bounded runner is `smoke/utsav.live.ts`, executed only with `UTSAV_LIVE_ENABLE=1` and `vitest.utsav.config.ts`. It is excluded from ordinary tests and CI. New live runs require appropriate quota authorization; do not retry automatically after failure.

## Generated artwork

The three transparent PNGs in `public/images/utsav/` were created with the built-in image-generation tool, using the approved “03 Utsav” board as the reference. Prompt direction: preserve the friendly miniature ivory elephant’s face, raised trunk and proportions; wedding marigolds/saffron textile, birthday coral ribbon, and community teal/green leaf accents; no text or interface. All have alpha transparency and use Next Image optimization only in the opened panel. The initial launcher uses a small inline elephant icon to avoid an initial illustration request.

Voice, interface language selection, RSVPs, seating, external reminders, accounts and databases remain outside this release.

## Local release results

- Formatting, lint, types and production build passed.
- **375 unit tests** passed; scoped statements 97.32%, branches 93.72%, functions 99.41%, lines 98%. Financial/storage gates remain unchanged.
- **38 browser cases** passed across desktop and mobile Chromium, including the original planning workflows.
- Both performance gates passed. Initial added gzip JavaScript versus the previous release: landing **915 bytes**, wizard **3,079**, saved events **3,091**, dashboard **1,246**, identically measured at both viewport sizes; limit **5,120 bytes**.
- Three-run mobile Lighthouse medians: landing **98 / 2,366 ms LCP**, wizard **100 / 1,820 ms**, saved events **100 / 1,809 ms**, dashboard **98 / 2,363 ms**. CLS is zero on event routes and approximately 0.000018 on landing. These are local laboratory results, not field metrics or a competition score.

[Numeric measurements](utsav-performance.json) record the tested working tree based on `37b2eec`. The existing historical baseline and report were preserved. Hosted CI and deployment status are reported separately from these local results.
