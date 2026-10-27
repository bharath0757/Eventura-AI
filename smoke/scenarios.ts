import type { EventBrief, EventRecord } from "@/types";
import { createRecord } from "@/lib/planner";
import { addDays, todayLocal } from "@/lib/dates";
import { requestSchema, parseOutput, type AIRequest } from "@/lib/ai/schemas";
import { resultSchema } from "@/lib/ai/result";
import { applyProposal } from "@/lib/ai/optimizer";
import type { Source } from "@/lib/ai/contracts";

export interface SmokeScenario {
  id: string;
  label: string;
  record: EventRecord;
  request: AIRequest;
  signals: RegExp[];
}
/** Synthetic fixtures only. Never import browser storage or load saved user events. */
export function smokeScenarios(reference = todayLocal()): SmokeScenario[] {
  const common = {
    date: addDays(reference, 120),
    location: "Hyderabad",
    dietary: "Vegetarian",
    accessibility: "Step-free entry",
    notes: "Synthetic release-verification event; no bookings or purchases.",
  };
  const briefs: EventBrief[] = [
    {
      ...common,
      category: "wedding",
      name: "Smoke garden wedding",
      guests: 120,
      budget: 240001,
      priorities: ["Food quality", "Photography"],
      details: { category: "wedding", ceremonyStyle: "fusion", theme: "Sunflower garden ceremony" },
    },
    {
      ...common,
      category: "birthday",
      name: "Smoke dinosaur craft birthday",
      guests: 30,
      budget: 45001,
      priorities: ["Entertainment", "Food quality"],
      details: {
        category: "birthday",
        ageGroup: "children",
        celebrationStyle: "Dinosaur craft party",
        activities: "Painting and a supervised treasure hunt",
      },
    },
    {
      ...common,
      category: "community",
      name: "Smoke repair workshop",
      guests: 80,
      budget: 60001,
      priorities: ["Educational value", "Sustainability", "Volunteer coordination"],
      details: {
        category: "community",
        format: "workshop",
        theme: "Repair and reuse workshop",
        volunteers: 12,
      },
    },
  ];
  const ids = [
    "00000000-0000-4000-8000-000000000001",
    "00000000-0000-4000-8000-000000000002",
    "00000000-0000-4000-8000-000000000003",
  ];
  const records = briefs.map((brief, i) =>
    createRecord(brief, reference, ids[i], `${reference}T12:00:00.000Z`),
  );
  const signals = [
    [/wedding|ceremon|fusion/i, /sunflower|garden/i, /120/, /photograph/i],
    [/birthday|children/i, /dinosaur/i, /craft|paint|treasure/i, /30/],
    [/community|workshop/i, /repair|reuse/i, /volunteer/i, /80/],
  ];
  const scenarios: SmokeScenario[] = records.map((record, i) => ({
    id: String.fromCharCode(65 + i),
    label: `${record.brief.category} recommendations`,
    record,
    request: { operation: "recommendations", brief: record.brief, plan: record.plan },
    signals: signals[i],
  }));
  const wedding = records[0];
  scenarios.push({
    id: "D",
    label: "contextual question",
    record: wedding,
    request: {
      operation: "ask",
      brief: wedding.brief,
      plan: wedding.plan,
      instruction:
        "What are the most important unfinished things to address this week for our wedding and 120 guests?",
    },
    signals: signals[0],
  });
  scenarios.push({
    id: "E",
    label: "protected budget optimization",
    record: wedding,
    request: {
      operation: "optimize",
      brief: wedding.brief,
      plan: wedding.plan,
      targetBudget: 180001,
      protectedCategories: ["food"],
      instruction:
        "Keep the catering allowance; simplify optional decoration while protecting guest comfort.",
    },
    signals: signals[0],
  });
  scenarios.forEach((s) => requestSchema.parse(s.request));
  return scenarios;
}
function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
/** Schema, source, context clues, independent financial checks and immutable input check. */
export function verifySmokeResponse(
  scenario: SmokeScenario,
  payload: unknown,
  expectedSource: Source,
) {
  const before = JSON.stringify(scenario.record);
  const result = resultSchema.parse(payload);
  requireCondition(
    result.operation === scenario.request.operation,
    "Response operation does not match the scenario.",
  );
  requireCondition(
    result.source === expectedSource,
    expectedSource === "live-ai"
      ? `Live verification failed: the API returned fallback. ${result.message}`
      : "Fallback verification failed: the API returned live AI.",
  );
  parseOutput(JSON.stringify(result.data), scenario.request);
  const text = JSON.stringify(result.data);
  const contextClues = scenario.signals.filter((signal) => signal.test(text)).length;
  if (result.operation === "recommendations")
    requireCondition(
      contextClues >= 2,
      "Response lacks sufficient event-specific context clues. Review recommendation relevance.",
    );
  if (result.operation === "optimize" && scenario.request.operation === "optimize") {
    const { proposal } = result,
      input = scenario.request;
    requireCondition(
      proposal.targetBudget === input.targetBudget,
      "Proposal target differs from the request.",
    );
    requireCondition(
      JSON.stringify(proposal.protectedCategories) === JSON.stringify(input.protectedCategories),
      "Proposal locks differ from the request.",
    );
    requireCondition(
      proposal.allocations.every((b) => Number.isSafeInteger(b.amount) && b.amount >= 0),
      "An allocation is not a non-negative integer.",
    );
    requireCondition(
      proposal.allocations.reduce((sum, b) => sum + b.amount, 0) === input.targetBudget,
      "Allocation sum differs from target.",
    );
    requireCondition(
      proposal.allocations.filter((b) => b.contingency).reduce((sum, b) => sum + b.amount, 0) >=
        Math.ceil(input.targetBudget / 10),
      "Contingency minimum is not satisfied.",
    );
    for (const key of input.protectedCategories)
      requireCondition(
        proposal.allocations.find((b) => b.category === key)?.amount ===
          input.plan.budget.find((b) => b.category === key)?.amount,
        "A protected amount changed.",
      );
    // Pure validation only: no eventStore, browser state, filesystem persistence or acceptance action.
    applyProposal(scenario.record, proposal);
  }
  requireCondition(
    JSON.stringify(scenario.record) === before,
    "Smoke verification mutated its synthetic baseline.",
  );
  return {
    scenario: scenario.id,
    operation: result.operation,
    source: result.source,
    contextClues,
  };
}
