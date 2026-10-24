import { loadEnvConfig } from "@next/env";
import { describe, it } from "vitest";
import { smokeScenarios, verifySmokeResponse } from "./scenarios";

// Match `next start` precedence; ordinary Vitest's NODE_ENV=test would ignore .env.local.
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const mode = process.env.AI_SMOKE_MODE ?? "live";
if (mode !== "live" && mode !== "fallback") throw new Error("AI_SMOKE_MODE must be live or fallback.");
const base = new URL(process.env.AI_SMOKE_URL ?? "http://localhost:3044");
const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || (!local && process.env.AI_SMOKE_ALLOW_REMOTE !== "1")) throw new Error("Use a local HTTP(S) API URL, or explicitly set AI_SMOKE_ALLOW_REMOTE=1 for an authorized remote endpoint. Never put credentials in the URL.");
const hasKey = Boolean(process.env.GEMINI_API_KEY?.trim());
const blocked = mode === "live" && local && !hasKey ? "GEMINI_API_KEY is not configured. Five live scenarios are BLOCKED; no requests will be made. Configure the key in .env.local, restart the app, then rerun. Never paste it into chat."
  : mode === "fallback" && hasKey ? "Fallback-only smoke test is blocked because this process has a live key. Use a server intentionally configured without a key. No requests will be made." : "";
if (blocked) console.info(blocked);
let previousFailure = false;
describe.skipIf(Boolean(blocked))(`Actual Eventura API smoke test (${mode}${blocked ? "; BLOCKED: missing or incompatible key configuration" : ""})`, () => {
  for (const scenario of smokeScenarios()) it(`${scenario.id}: ${scenario.label}`, async context => {
    if (previousFailure) context.skip();
    const before = JSON.stringify(scenario.record);
    try {
      const response = await fetch(new URL("/api/ai/plan", base), { method: "POST", headers: { "Content-Type": "application/json", Origin: base.origin }, body: JSON.stringify(scenario.request), signal: AbortSignal.timeout(28_000), redirect: "error" });
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}. No raw response or credentials were logged.`);
      let payload: unknown;
      try { payload = await response.json(); } catch { throw new Error("API returned unreadable JSON."); }
      let summary: ReturnType<typeof verifySmokeResponse>;
      try { summary = verifySmokeResponse(scenario, payload, mode === "live" ? "live-ai" : "rule-based"); }
      catch (e) { throw new Error(e instanceof Error && e.name !== "ZodError" ? e.message : "API response failed schema validation. Raw output was suppressed."); }
      if (JSON.stringify(scenario.record) !== before) throw new Error("Synthetic event changed during the request.");
      console.info(`PASS ${summary.scenario}: ${scenario.label}; source=${summary.source}; context-clues=${summary.contextClues}. No saved event was modified.`);
    } catch (e) {
      previousFailure = true; // Avoid repeated paid calls after an auth/quota/network/output failure.
      if (e instanceof Error && (e.name === "TimeoutError" || e instanceof TypeError)) throw new Error("Endpoint unavailable or timed out. Start the app at AI_SMOKE_URL; raw network details were suppressed.");
      throw e;
    }
  });
});
