import { z } from "zod";
import { budgetProfiles, vendorTemplates } from "@/lib/planner/profiles";
import { budgetSchema, planSchema, recordSchema } from "@/lib/validation/schemas";
import type { EventRecord, BudgetItem } from "@/types";
import { guidanceSchema, type Guidance } from "./contracts";
import { requestSchema, type OptimizeRequest } from "./schemas";

export class OptimizationError extends Error {}
export const proposalSchema = z.object({ targetBudget: budgetSchema.shape.budget, protectedCategories: z.array(z.string()).max(10), guidance: z.array(guidanceSchema).max(10), allocations: planSchema.shape.budget, base: z.string().max(16_000) }).strict();
export type BudgetProposal = z.infer<typeof proposalSchema>;
export function budgetContext(r: Pick<EventRecord, "brief" | "plan">) { return JSON.stringify([r.brief, r.plan.budget]); }
export function minimumReserve(total: number) { return Math.ceil(total / 10); }
/** Hamilton largest remainder, exact BigInt products, original category order breaks ties. */
function distribute(total: number, weights: number[]): number[] {
  const denominator = weights.reduce((sum, n) => sum + BigInt(n), BigInt(0));
  if (!weights.length) { if (total) throw new OptimizationError("All categories are protected. The target must equal the current budget."); return []; }
  if (denominator <= 0) throw new OptimizationError("There are no flexible allocation weights.");
  const rows = weights.map((w, index) => { const n = BigInt(total) * BigInt(w); return { index, amount: Number(n / denominator), remainder: n % denominator }; });
  const ranked = [...rows].sort((a, b) => a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1);
  const remaining = total - rows.reduce((s, r) => s + r.amount, 0);
  for (let i = 0; i < remaining; i++) ranked[i].amount++;
  return rows.map(r => r.amount);
}
export function optimizeBudget(input: OptimizeRequest, advice: Guidance[]): BudgetProposal {
  const r = requestSchema.parse(input);
  if (r.operation !== "optimize") throw new OptimizationError("An optimization request is required.");
  const guidance = z.array(guidanceSchema).max(10).parse(advice);
  const profile = budgetProfiles[r.brief.category];
  if (guidance.some(g => !profile.some(p => p.key === g.category)) || new Set(guidance.map(g => g.category)).size !== guidance.length) throw new OptimizationError("Budget guidance includes an invalid or repeated category.");
  const protectedSet = new Set(r.protectedCategories);
  const reserve = r.plan.budget.find(b => b.contingency)!;
  const required = minimumReserve(r.targetBudget);
  if (protectedSet.has(reserve.category) && reserve.amount < required) throw new OptimizationError("The protected reserve is below 10% of the target. Unprotect the reserve or lower the target.");
  const fixed = r.plan.budget.map(b => protectedSet.has(b.category) ? b.amount : b.contingency ? required : 0);
  let remaining = r.targetBudget - fixed.reduce((s, n) => s + n, 0);
  if (remaining < 0) throw new OptimizationError("The target cannot cover protected allocations and the required 10% contingency reserve. Raise the target or unprotect a category.");
  const flexible = r.plan.budget.filter(b => !protectedSet.has(b.category) && !b.contingency);
  // If the reserve is the only unlocked category, it can absorb the remainder.
  if (!flexible.length && !protectedSet.has(reserve.category)) {
    fixed[r.plan.budget.findIndex(b => b.contingency)] += remaining;
    remaining = 0;
  }
  const factors = { reduce: 75, maintain: 100, increase: 125, review: 100 };
  const amounts = distribute(remaining, flexible.map(b => profile.find(p => p.key === b.category)!.percentage * factors[guidance.find(g => g.category === b.category)?.action ?? "maintain"]));
  const allocations: BudgetItem[] = r.plan.budget.map((b, index) => ({ ...b, amount: protectedSet.has(b.category) || b.contingency ? fixed[index] : amounts[flexible.findIndex(f => f.category === b.category)] }));
  const percentages = distribute(100, allocations.map(b => b.amount));
  allocations.forEach((b, i) => { b.percentage = percentages[i]; });
  if (allocations.reduce((s, b) => s + b.amount, 0) !== r.targetBudget || allocations.some(b => !Number.isSafeInteger(b.amount) || b.amount < 0) || allocations.find(b => b.contingency)!.amount < required) throw new OptimizationError("The proposed budget could not be balanced.");
  return proposalSchema.parse({ targetBudget: r.targetBudget, protectedCategories: r.protectedCategories, guidance, allocations, base: budgetContext(r) });
}
/** Called only by explicit acceptance. Recompute instead of trusting returned financial values. */
export function applyProposal(existing: EventRecord, input: BudgetProposal): EventRecord {
  const proposal = proposalSchema.parse(input);
  if (budgetContext(existing) !== proposal.base) throw new OptimizationError("This event's budget or preferences changed. Request a fresh proposal before applying it.");
  const checked = optimizeBudget({ operation: "optimize", brief: existing.brief, plan: existing.plan, targetBudget: proposal.targetBudget, protectedCategories: proposal.protectedCategories, instruction: "" }, proposal.guidance);
  if (JSON.stringify(checked.allocations) !== JSON.stringify(proposal.allocations)) throw new OptimizationError("The proposal failed verification. Please generate it again.");
  const vendors = existing.plan.vendors.map(v => {
    const key = vendorTemplates[existing.brief.category].find(t => `vendor-${t.key}` === v.id)?.budgetKey;
    return key ? { ...v, estimatedCost: checked.allocations.find(b => b.category === key)!.amount } : v;
  });
  return recordSchema.parse({ ...existing, brief: { ...existing.brief, budget: checked.targetBudget }, plan: { ...existing.plan, budget: checked.allocations, vendors } });
}
