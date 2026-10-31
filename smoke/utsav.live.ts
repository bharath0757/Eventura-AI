import { it, expect } from "vitest";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { record } from "../tests/fixtures";
import { chatResultSchema } from "../src/lib/ai/chat-contracts";
const enabled = process.env.UTSAV_LIVE_ENABLE === "1";
it.skipIf(!enabled)(
  "at most three synthetic Utsav requests, stopping at first failure",
  async () => {
    const base = new URL(process.env.UTSAV_LIVE_URL || "http://127.0.0.1:3000");
    if (!["127.0.0.1", "localhost"].includes(base.hostname))
      throw new Error("Local synthetic live checks only.");
    const event = record();
    const history: { role: "user" | "assistant"; text: string }[] = [];
    const results: unknown[] = [];
    const scenarios = [
      { message: "In one sentence, what can you help me plan?", purpose: "chat" },
      {
        message:
          "Using my attached event, name one consideration for the dietary and access needs.",
        purpose: "chat",
        context: { brief: event.brief, plan: event.plan },
      },
      {
        message: "Draft a short invitation for this event, using placeholders for missing details.",
        purpose: "invitation",
        context: { brief: event.brief, plan: event.plan },
      },
    ];
    let failure = "";
    for (const [i, scenario] of scenarios.entries()) {
      const start = Date.now();
      try {
        const response = await fetch(new URL("/api/ai/chat", base), {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: base.origin },
          body: JSON.stringify({ ...scenario, history: i === 2 ? history : [] }),
          signal: AbortSignal.timeout(70000),
          redirect: "error",
        });
        const parsed = chatResultSchema.safeParse(await response.json());
        if (!response.ok || !parsed.success)
          throw new Error(`HTTP ${response.status}; invalid response`);
        const result = parsed.data;
        results.push({
          scenario: i + 1,
          status: response.status,
          source: result.source,
          notice: result.message,
          durationMs: Date.now() - start,
          reply: result.reply,
        });
        if (result.source !== "live-ai") {
          failure = result.message;
          break;
        }
        if (i === 1)
          history.push(
            { role: "user", text: scenario.message },
            { role: "assistant", text: result.reply.slice(0, 2400) },
          );
        if (i === 2 && !/\[[^\]]+\]/.test(result.reply)) {
          failure = "Invitation omitted required placeholders";
          break;
        }
      } catch {
        failure = "Live request failed or exceeded its deadline; further requests stopped.";
        results.push({ scenario: i + 1, failure, durationMs: Date.now() - start });
        break;
      }
    }
    const report = {
      recordedAt: new Date().toISOString(),
      attempted: results.length,
      maximum: 3,
      passed: !failure && results.length === 3,
      results,
      failure,
    };
    const output = process.env.UTSAV_LIVE_REPORT || "test-results/utsav-live.json";
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify(report, null, 2) + "\n");
    console.info(JSON.stringify({ attempted: results.length, passed: report.passed, failure }));
    expect(report.passed, failure).toBe(true);
  },
);
