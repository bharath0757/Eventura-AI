import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { assist } from "@/lib/ai/service";
import type { ProviderUsage } from "@/lib/ai/client";
import { smokeScenarios, verifySmokeResponse } from "./scenarios";

// Explicit opt-in; never included in ordinary tests, builds, or CI.
const reportPath = process.env.AI_COMPARE_REPORT;
if (process.env.AI_COMPARE_ENABLED !== "1" || !process.env.GEMINI_API_KEY?.trim() || !reportPath) {
  throw new Error(
    "Comparison requires explicit opt-in, an existing server-side key and a fresh report path. No requests made.",
  );
}
const destination = resolve(reportPath);
if (existsSync(destination))
  throw new Error(
    "A report already exists. Review the previous request count before authorizing another run.",
  );
interface Outcome {
  model: string;
  scenario: string;
  stage: string;
  durationMs: number;
  passed: boolean;
  contextClues?: number;
  usage?: ProviderUsage;
  failure?: string;
  data?: unknown;
}
const report: {
  startedAt: string;
  limit: number;
  calls: number;
  results: Outcome[];
  selectedModel: string;
  selectionReason: string;
} = {
  startedAt: new Date().toISOString(),
  limit: 12,
  calls: 0,
  results: [],
  selectedModel: "gemini-3.8-flash",
  selectionReason: "Comparison incomplete.",
};
function persist() {
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, JSON.stringify(report, null, 2) + "\n", "utf8");
}
const scenarios = smokeScenarios();
async function run(model: string, index: number, stage: string) {
  if (report.calls >= report.limit) throw new Error("The 12-call budget has been exhausted.");
  process.env.GEMINI_MODEL = model;
  const scenario = scenarios[index];
  const before = JSON.stringify(scenario.record);
  report.calls += 1;
  persist(); // Reserve a call before sending; interruption cannot erase usage.
  const started = performance.now();
  const outcome: Outcome = { model, scenario: scenario.id, stage, durationMs: 0, passed: false };
  try {
    const result = await assist(scenario.request, undefined, (usage) => {
      outcome.usage = usage;
    });
    const verified = verifySmokeResponse(scenario, result, "live-ai");
    if (verified.contextClues < 2) throw new Error("Insufficient event-specific context.");
    if (JSON.stringify(scenario.record) !== before) throw new Error("Input was modified.");
    outcome.passed = true;
    outcome.contextClues = verified.contextClues;
    outcome.data = result.data;
  } catch (error) {
    // Deliberately retain only locally generated, bounded verification labels.
    outcome.failure =
      error instanceof Error && error.message.startsWith("Live verification failed:")
        ? error.message
        : "Response failed the context, schema or safety checks.";
  }
  outcome.durationMs = Math.round(performance.now() - started);
  report.results.push(outcome);
  persist();
  console.info(
    JSON.stringify({
      model,
      scenario: scenario.id,
      stage,
      durationMs: outcome.durationMs,
      passed: outcome.passed,
      usage: outcome.usage,
      failure: outcome.failure,
    }),
  );
  return outcome;
}
function median(values: number[]) {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)];
}
it("compares two models with a strict 12-call ceiling and stop-on-failure", async () => {
  for (const model of ["gemini-3.8-flash", "gemini-3.5-flash-lite"]) {
    for (let i = 0; i < scenarios.length; i++)
      if (!(await run(model, i, "comparison")).passed) break;
  }
  const baseline = report.results.filter((r) => r.model === "gemini-3.8-flash");
  const candidate = report.results.filter((r) => r.model === "gemini-3.5-flash-lite");
  const candidatePassed = candidate.length === 5 && candidate.every((r) => r.passed);
  const matched = baseline
    .filter((r) => r.passed)
    .map((r) => ({
      baseline: r.durationMs,
      candidate: candidate.find((c) => c.scenario === r.scenario)?.durationMs ?? Infinity,
    }));
  const faster =
    matched.length > 0 &&
    median(matched.map((r) => r.candidate)) <= median(matched.map((r) => r.baseline)) * 0.75;
  const eligible = candidatePassed && (baseline.some((r) => !r.passed) || faster);
  if (eligible) {
    const first = await run("gemini-3.5-flash-lite", 0, "confirmation");
    const second = first.passed ? await run("gemini-3.5-flash-lite", 4, "confirmation") : null;
    if (first.passed && second?.passed) {
      report.selectedModel = "gemini-3.5-flash-lite";
      report.selectionReason =
        "Five scenarios and both confirmations passed; candidate had fewer failures or at least 25% lower matched median latency.";
    } else report.selectionReason = "Candidate confirmation failed; retain current model.";
  } else
    report.selectionReason =
      "Candidate did not pass all scenarios with a demonstrated reliability or latency improvement; retain current model.";
  persist();
  console.info(
    JSON.stringify({
      calls: report.calls,
      selectedModel: report.selectedModel,
      selectionReason: report.selectionReason,
    }),
  );
});
