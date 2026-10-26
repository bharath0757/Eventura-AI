import { describe, expect, it } from "vitest";
import { smokeScenarios, verifySmokeResponse } from "../smoke/scenarios";
import { localRecommendations, localAnswer, localOptimization } from "@/lib/ai/fallback";
import { optimizeBudget } from "@/lib/ai/optimizer";
import { requestSchema } from "@/lib/ai/schemas";
const scenarios = smokeScenarios("2026-10-24");
function fixture(index: number) {
  const request = scenarios[index].request;
  const data =
    request.operation === "recommendations"
      ? localRecommendations(request)
      : request.operation === "ask"
        ? localAnswer(request, "2026-10-24")
        : localOptimization(request);
  return {
    operation: request.operation,
    source: "rule-based",
    message: "Rule-based test fixture; no live provider call.",
    data,
    ...(request.operation === "optimize"
      ? { proposal: optimizeBudget(request, localOptimization(request).guidance) }
      : {}),
  };
}
describe("repeatable API smoke-test safety", () => {
  it("creates five valid synthetic requests with future dates and separate event categories", () => {
    expect(scenarios).toHaveLength(5);
    expect(scenarios.slice(0, 3).map((s) => s.record.brief.category)).toEqual([
      "wedding",
      "birthday",
      "community",
    ]);
    for (const s of scenarios) {
      expect(requestSchema.safeParse(s.request).success).toBe(true);
      expect(s.record.brief.date > "2026-10-24").toBe(true);
    }
  });
  scenarios.forEach((s, i) =>
    it(`validates ${s.id} without mutating a record`, () => {
      const before = JSON.stringify(s.record);
      expect(verifySmokeResponse(s, fixture(i), "rule-based").source).toBe("rule-based");
      expect(JSON.stringify(s.record)).toBe(before);
    }),
  );
  it("never reports fallback as successful live verification", () =>
    expect(() => verifySmokeResponse(scenarios[0], fixture(0), "live-ai")).toThrow(
      /returned fallback/,
    ));
  it("rejects forged financial amounts and changed protected selections", () => {
    const data = fixture(4);
    if (!data.proposal) throw new Error();
    data.proposal.allocations[0].amount++;
    expect(() => verifySmokeResponse(scenarios[4], data, "rule-based")).toThrow();
    const altered = fixture(4);
    if (!altered.proposal) throw new Error();
    altered.proposal.protectedCategories = [];
    expect(() => verifySmokeResponse(scenarios[4], altered, "rule-based")).toThrow(/locks differ/);
  });
  it("flags generic recommendations without event-specific context", () => {
    const data = fixture(1);
    const neutral = {
      title: "An idea",
      description: "Gather together",
      rationale: "It is useful",
      category: "food",
      nextAction: "Review the idea",
    };
    const generic = {
      ...data,
      data: {
        headline: "Suggestions",
        summary: "A useful event",
        ideas: [neutral, neutral],
        risks: [
          { risk: "A concern", relevance: "It could matter", mitigation: "Prepare an alternative" },
        ],
        assumptions: ["Check details"],
        nextActions: ["Review"],
      },
    };
    expect(() => verifySmokeResponse(scenarios[1], generic, "rule-based")).toThrow(/context clues/);
  });
});
