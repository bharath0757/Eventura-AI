import { describe, expect, it } from "vitest";
import { optimizeBudget, applyProposal, minimumReserve } from "@/lib/ai/optimizer";
import { recordSchema } from "@/lib/validation/schemas";
import { eventStore, STORAGE_KEY, type StoragePort } from "@/lib/storage/events";
import { categories } from "@/lib/config";
import type { OptimizeRequest } from "@/lib/ai/schemas";
import { record } from "./fixtures";
const request = (targetBudget = 12001, protectedCategories: string[] = []): OptimizeRequest => ({
  operation: "optimize",
  brief: record().brief,
  plan: record().plan,
  targetBudget,
  protectedCategories,
  instruction: "",
});
describe("deterministic optimizer", () => {
  for (const category of categories)
    for (const target of [1000, 1001, 3333, 12001, 15001, 99991, 100_000_000])
      it(`${category} exact allocation at ${target}`, () => {
        const r = record(category),
          before = JSON.stringify(r),
          input = { ...request(target), brief: r.brief, plan: r.plan };
        const p = optimizeBudget(input, []);
        expect(p.allocations.reduce((s, b) => s + b.amount, 0)).toBe(target);
        expect(p.allocations.reduce((s, b) => s + b.percentage, 0)).toBe(100);
        expect(p.allocations.every((b) => Number.isSafeInteger(b.amount) && b.amount >= 0)).toBe(
          true,
        );
        expect(p.allocations.find((b) => b.contingency)!.amount).toBeGreaterThanOrEqual(
          minimumReserve(target),
        );
        expect(p.allocations.map((b) => b.category)).toEqual(r.plan.budget.map((b) => b.category));
        expect(optimizeBudget(input, [])).toEqual(p);
        expect(JSON.stringify(r)).toBe(before);
        expect(recordSchema.safeParse(applyProposal(r, p)).success).toBe(true);
      });
  it.each([{ keys: ["food"] }, { keys: ["food", "venue"] }, { keys: ["food", "reserve"] }])(
    "preserves protected $keys",
    ({ keys }) => {
      const p = optimizeBudget(request(12001, keys), [
        { category: "food", action: "reduce", rationale: "Less food", alternative: "Short menu" },
      ]);
      for (const key of keys)
        expect(p.allocations.find((b) => b.category === key)!.amount).toBe(
          record().plan.budget.find((b) => b.category === key)!.amount,
        );
    },
  );
  it("retains every locked allocation when an elevated reserve makes the target feasible", () => {
    const original = record(),
      spending = original.plan.budget.filter((b) => !b.contingency).map((b) => b.category);
    const saved = applyProposal(original, optimizeBudget(request(20000, spending), []));
    const input = {
      ...request(
        20000,
        saved.plan.budget.map((b) => b.category),
      ),
      brief: saved.brief,
      plan: saved.plan,
    };
    expect(optimizeBudget(input, []).allocations).toEqual(saved.plan.budget);
    expect(() => optimizeBudget({ ...input, targetBudget: 20001 }, [])).toThrow(
      /All categories are protected/,
    );
    expect(() => optimizeBudget({ ...input, targetBudget: 19999 }, [])).toThrow(/cannot cover/);
  });
  it("rejects repeated guidance categories instead of silently overriding them", () => {
    const item = {
      category: "food",
      action: "maintain" as const,
      rationale: "Priority",
      alternative: "Keep menu",
    };
    expect(() => optimizeBudget(request(), [item, item])).toThrow(/repeated category/);
  });
  it("rejects insufficient protected budget", () =>
    expect(() => optimizeBudget(request(1000, ["food"]), [])).toThrow(/target cannot cover/));
  it("allows the reserve to absorb a higher target when every spending category is locked", () => {
    const keys = record()
        .plan.budget.filter((b) => !b.contingency)
        .map((b) => b.category),
      p = optimizeBudget(request(20000, keys), []);
    expect(p.allocations.reduce((s, b) => s + b.amount, 0)).toBe(20000);
    for (const key of keys)
      expect(p.allocations.find((b) => b.category === key)!.amount).toBe(
        record().plan.budget.find((b) => b.category === key)!.amount,
      );
    expect(p.allocations.find((b) => b.contingency)!.amount).toBeGreaterThanOrEqual(2000);
  });
  it("rejects protected reserve below minimum", () =>
    expect(() => optimizeBudget(request(50000, ["reserve"]), [])).toThrow(/protected reserve/));
  it.each([999, 1.5, 100_000_001, NaN])("rejects invalid target %s", (n) =>
    expect(() => optimizeBudget(request(n), [])).toThrow(),
  );
  it("rejects unknown protected keys", () =>
    expect(() => optimizeBudget(request(12001, ["madeup"]), [])).toThrow());
  it("rejects unknown model categories", () =>
    expect(() =>
      optimizeBudget(request(), [
        { category: "madeup", action: "reduce", rationale: "x", alternative: "y" },
      ]),
    ).toThrow());
  it("rejects invalid model actions", () =>
    expect(() =>
      optimizeBudget(request(), [
        { category: "food", action: "destroy", rationale: "x", alternative: "y" },
      ] as never),
    ).toThrow());
  it("weights guidance while keeping totals exact", () => {
    const base = optimizeBudget(request(), []),
      p = optimizeBudget(request(), [
        { category: "food", action: "increase", rationale: "Priority", alternative: "Menu" },
      ]);
    expect(p.allocations.find((b) => b.category === "food")!.amount).toBeGreaterThan(
      base.allocations.find((b) => b.category === "food")!.amount,
    );
    expect(p.allocations.reduce((s, b) => s + b.amount, 0)).toBe(12001);
  });
  it("rejects altered proposed amounts", () => {
    const p = optimizeBudget(request(), []);
    p.allocations[0].amount++;
    expect(() => applyProposal(record(), p)).toThrow(/verification/);
  });
  it("rejects stale brief and budget", () => {
    const r = record(),
      p = optimizeBudget(request(), []);
    r.brief.notes = "changed";
    expect(() => applyProposal(r, p)).toThrow(/changed/);
  });
});
describe("approved changes and backwards-compatible persistence", () => {
  function setup() {
    let raw: string | null = null;
    const port: StoragePort = {
      getItem: () => raw,
      setItem: (_, v) => {
        raw = v;
      },
    };
    const store = eventStore(port, () => "2026-10-24T12:00:00.000Z");
    store.save(record());
    return { store, port, raw: () => raw };
  }
  it("retains original v1 records without assistant metadata", () => {
    const { store } = setup();
    expect(store.get(record().id)?.savedIdeas).toBeUndefined();
  });
  it("preview and rejection never write saved data", () => {
    const { store, raw } = setup(),
      before = raw();
    optimizeBudget(request(), []);
    expect(raw()).toBe(before);
    expect(store.get(record().id)?.brief.budget).toBe(15001);
  });
  it("acceptance saves total, preferences, IDs and current task statuses", () => {
    const { store } = setup(),
      r = record(),
      p = optimizeBudget(request(), []);
    store.setTaskStatus(r.id, "timeline", r.plan.timeline[0].id, "completed");
    store.setTaskStatus(r.id, "vendors", r.plan.vendors[0].id, "in-progress");
    const updated = store.acceptProposal(r.id, p);
    expect(store.get(r.id)).toEqual(updated);
    expect(updated.brief.budget).toBe(12001);
    expect(updated.brief.details).toEqual(r.brief.details);
    expect(updated.plan.timeline[0].status).toBe("completed");
    expect(updated.plan.vendors[0].status).toBe("in-progress");
    expect(updated.updatedAt).toBe("2026-10-24T12:00:00.000Z");
    expect(updated.createdAt).toBe(r.createdAt);
  });
  it("failed save retains the original persisted record", () => {
    const { store, port, raw } = setup(),
      before = raw();
    port.setItem = () => {
      throw new Error("quota");
    };
    expect(() => store.acceptProposal(record().id, optimizeBudget(request(), []))).toThrow(
      /could not be saved/,
    );
    expect(raw()).toBe(before);
  });
  it("retains validated ideas without duplicates and preserves corrupt records", () => {
    const { store, port } = setup();
    const raw = JSON.parse(port.getItem(STORAGE_KEY)!);
    raw.events.push({ id: "corrupt" });
    port.setItem(STORAGE_KEY, JSON.stringify(raw));
    const idea = {
      title: "Shared welcome",
      description: "Invite stories",
      rationale: "Connect guests",
      category: "food",
      nextAction: "Pick a host",
    };
    store.retainIdea(record().id, idea, "live-ai");
    store.retainIdea(record().id, idea, "live-ai");
    expect(store.get(record().id)?.savedIdeas).toHaveLength(1);
    expect(store.list().warnings).toHaveLength(1);
    expect(() =>
      store.retainIdea(record().id, { ...idea, category: "unknown" }, "live-ai"),
    ).toThrow();
  });
});

describe("financial proposal boundary", () => {
  it("rejects a non-optimization operation before allocation", () => {
    const input = { operation: "recommendations", brief: record().brief, plan: record().plan };
    expect(() =>
      optimizeBudget(input as unknown as Parameters<typeof optimizeBudget>[0], []),
    ).toThrow(/optimization request/);
  });
  it.each(["sum", "fraction", "negative", "reserve", "missing reserve"])(
    "rejects invalid %s allocations",
    async (fault) => {
      const { assertBalancedBudget } = await import("@/lib/ai/optimizer");
      const proposal = optimizeBudget(request(), []);
      const items = structuredClone(proposal.allocations);
      const reserve = items.find((item) => item.contingency)!;
      if (fault === "sum") items[0].amount++;
      if (fault === "fraction") {
        items[0].amount += 0.5;
        items[1].amount -= 0.5;
      }
      if (fault === "negative") {
        items[1].amount += items[0].amount + 1;
        items[0].amount = -1;
      }
      if (fault === "reserve") {
        reserve.amount--;
        items[0].amount++;
      }
      if (fault === "missing reserve") reserve.contingency = false;
      expect(() => assertBalancedBudget(items, proposal.targetBudget)).toThrow(
        /could not be balanced/,
      );
    },
  );
});
