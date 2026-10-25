import { describe, expect, it } from "vitest";
import { requestSchema, parseOutput, type AIRequest } from "@/lib/ai/schemas";
import { localRecommendations, localAnswer, localOptimization } from "@/lib/ai/fallback";
import { categories } from "@/lib/config";
import { record } from "./fixtures";
export function aiRequest(operation: AIRequest["operation"] = "recommendations"): AIRequest {
  const { brief, plan } = record();
  return operation === "recommendations" ? { operation, brief, plan } : operation === "ask" ? { operation, brief, plan, instruction: "How can I manage more guests?" } : { operation, brief, plan, instruction: "", targetBudget: 12001, protectedCategories: ["food"] };
}
describe("AI request boundary", () => {
  it.each(["recommendations", "ask", "optimize"] as const)("accepts %s", op => expect(requestSchema.safeParse(aiRequest(op)).success).toBe(true));
  it.each([
    { operation: "unknown" }, { brief: undefined }, { plan: undefined }, { instruction: "x".repeat(1001) }, { instruction: " " },
  ])("rejects malformed ask %j", change => expect(requestSchema.safeParse({ ...aiRequest("ask"), ...change }).success).toBe(false));
  it.each([{ targetBudget: 0 }, { targetBudget: 100_000_001 }, { targetBudget: 1000.1 }, { protectedCategories: ["foreign"] }, { protectedCategories: ["food", "food"] }, { protectedCategories: undefined }])("rejects malformed optimization %j", change => expect(requestSchema.safeParse({ ...aiRequest("optimize"), ...change }).success).toBe(false));
  it("rejects invalid brief and unsupported category", () => { for (const change of [{ category: "party" }, { budget: -1 }, { guests: 0 }]) expect(requestSchema.safeParse({ ...aiRequest(), brief: { ...record().brief, ...change } }).success).toBe(false); });
  it("rejects forged allocations, categories and reserve flags", () => {
    for (const change of [{ amount: 1 }, { category: "forged" }, { contingency: true }]) { const r = aiRequest(); Object.assign(r.plan.budget[0], change); expect(requestSchema.safeParse(r).success).toBe(false); }
  });
  it("rejects a mismatched date and category context", () => {
    const r = aiRequest(); r.brief.date = "2027-03-01"; expect(requestSchema.safeParse(r).success).toBe(false);
    expect(requestSchema.safeParse({ ...aiRequest(), plan: record("birthday").plan }).success).toBe(false);
  });
  it("rejects an oversized plan", () => { const r = aiRequest(); r.plan.ideas = Array.from({ length: 31 }, (_, i) => ({ ...r.plan.ideas[0], id: String(i) })); expect(requestSchema.safeParse(r).success).toBe(false); });
  it("rejects unknown envelope properties", () => expect(requestSchema.safeParse({ ...aiRequest(), apiKey: "not-allowed" }).success).toBe(false));
});
describe("structured responses", () => {
  for (const category of categories) it(`valid personalized responses for ${category}`, () => {
    const { brief, plan } = record(category), r: AIRequest = { operation: "recommendations", brief, plan };
    const output = localRecommendations(r); expect(parseOutput(JSON.stringify(output), r)).toEqual(output); expect(output.summary).toContain(brief.name);
    const ask: AIRequest = { ...r, operation: "ask", instruction: "Vegetarian catering?" };
    expect(parseOutput(JSON.stringify(localAnswer(ask)), ask)).toHaveProperty("answer");
    const optimize: AIRequest = { ...r, operation: "optimize", targetBudget: 12001, protectedCategories: [], instruction: "" };
    expect(parseOutput(JSON.stringify(localOptimization(optimize)), optimize)).toHaveProperty("guidance");
  });
  it.each(["", "  ", "{", "null", "{}", "x".repeat(24001)])("rejects invalid raw output %s", raw => expect(() => parseOutput(raw, aiRequest())).toThrow());
  it("rejects missing fields, overlong text and malformed risk", () => {
    const valid = localRecommendations(aiRequest());
    for (const change of [{ headline: undefined }, { headline: "x".repeat(161) }, { risks: [{ risk: "Rain" }] }, { ideas: [] }, { summary: " " }]) expect(() => parseOutput(JSON.stringify({ ...valid, ...change }), aiRequest())).toThrow();
  });
  it("rejects unknown idea category", () => { const output = localRecommendations(aiRequest()); output.ideas[0].category = "fake"; expect(() => parseOutput(JSON.stringify(output), aiRequest())).toThrow(); });
  it("keeps fallback output valid for completed plans and maximum stored risk fields",()=>{
    const r=aiRequest();r.plan.timeline.forEach(t=>{t.status="completed";});
    r.plan.risks[0]={...r.plan.risks[0],reason:"r".repeat(1500),mitigation:"m".repeat(1500),backup:"b".repeat(1500)};
    expect(requestSchema.safeParse(r).success).toBe(true);
    const output=localRecommendations(r);expect(()=>parseOutput(JSON.stringify(output),r)).not.toThrow();expect(output.nextActions).toHaveLength(1);
  });
  it("rejects arbitrary money, invalid guidance actions, unknown and duplicate categories", () => {
    const r = aiRequest("optimize"); if (r.operation !== "optimize") throw new Error();
    for (const change of [{ action: "spend" }, { category: "unknown" }, { amount: 999 }]) { const output = localOptimization(r); Object.assign(output.guidance[0], change); expect(() => parseOutput(JSON.stringify(output), r)).toThrow(); }
    const output = localOptimization(r); output.guidance[1].category = output.guidance[0].category; expect(() => parseOutput(JSON.stringify(output), r)).toThrow();
  });
  it("fallback answers depend on question, date and current task states", () => {
    const r = aiRequest("ask"); if (r.operation !== "ask") throw new Error();
    expect(localAnswer({ ...r, instruction: "Vegetarian food?" }).answer).toContain("Vegetarian");
    expect(localAnswer({ ...r, instruction: "Sustainable decoration?" }).answer).toContain("reusable");
    expect(localAnswer({ ...r, instruction: "Tasks this week?" }, "2027-02-14").answer).toContain(r.plan.timeline[0].title);
    r.plan.timeline.forEach(t => { t.status = "completed"; });
    expect(localAnswer({ ...r, instruction: "Tasks this week?" }, "2027-02-14").answer).toContain("No unfinished");
  });
});
