import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createSamplePlan, SAMPLE_BRIEF, SAMPLE_REFERENCE_DATE } from "@/lib/sample-plan";
import { generatePlan } from "@/lib/planner";
import { sampleDownload } from "@/lib/sample-download";

describe("canonical sample plan", () => {
  it("uses the same allocation and task identities as a saved plan", () => {
    const sample = createSamplePlan();
    const canonical = generatePlan(SAMPLE_BRIEF, SAMPLE_REFERENCE_DATE);
    expect(sample.budget.map((item) => [item.id, item.amount])).toEqual(
      canonical.budget.map((item) => [item.id, item.amount]),
    );
    expect(sample.budget.reduce((sum, item) => sum + item.amount, 0)).toBe(sample.total);
    expect(sample.timeline.map((item) => item.id)).toEqual(
      canonical.timeline.map((item) => item.id),
    );
    expect(sample.vendors.map((item) => item.id)).toEqual(canonical.vendors.map((item) => item.id));
    expect(JSON.parse(JSON.stringify(sample))).toEqual(sample);
  });
  it("downloads only preview progress without changing canonical plan data", () => {
    const sample = createSamplePlan();
    const original = JSON.stringify(sample);
    const text = sampleDownload(sample, {
      completed: [sample.timeline[0].id],
      vendors: { [sample.vendors[0].id]: "Contacted" },
    });
    expect(text).toContain(`[x] ${sample.timeline[0].title}`);
    expect(text).toContain(`[ ] ${sample.timeline[1].title}`);
    expect(text).toContain(`${sample.vendors[0].title}: Contacted`);
    expect(text).toContain(sample.totalLabel);
    expect(text).toContain("temporary");
    expect(JSON.stringify(sample)).toBe(original);
  });
});
