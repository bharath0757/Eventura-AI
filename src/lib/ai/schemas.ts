import { z } from "zod";
import { briefSchema, planSchema, recordSchema, budgetSchema } from "@/lib/validation/schemas";
import { budgetProfiles } from "@/lib/planner/profiles";
import { generatePlan } from "@/lib/planner";
import { recommendationsSchema, optimizationSchema, questionSchema } from "./contracts";
import { AI_LIMITS } from "./limits";

const context = { brief: briefSchema, plan: planSchema };
const instruction = z.string().trim().max(AI_LIMITS.instruction);
export const requestSchema = z.discriminatedUnion("operation", [
  z.object({ ...context, operation: z.literal("recommendations") }).strict(),
  z.object({ ...context, operation: z.literal("ask"), instruction: instruction.min(1) }).strict(),
  z.object({ ...context, operation: z.literal("optimize"), instruction: instruction.default(""), targetBudget: budgetSchema.shape.budget, protectedCategories: z.array(z.string().min(1).max(80)).max(10) }).strict(),
]).superRefine((r, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: "custom", message });
  const parsed = recordSchema.safeParse({ id: "00000000-0000-4000-8000-000000000000", schemaVersion: 1, ...contextRecord(r), createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" });
  if (!parsed.success) { fail("The brief and plan are inconsistent."); return; }
  const profile = budgetProfiles[r.brief.category];
  if (r.plan.budget.length !== profile.length || profile.some(p => !r.plan.budget.some(b => b.id === `budget-${p.key}` && b.category === p.key && b.label === p.label && b.contingency === !!p.contingency))) fail("Budget categories must match this event type.");
  if (r.plan.timeline.length > 30 || r.plan.vendors.length > 30 || r.plan.ideas.length > 30 || r.plan.risks.length > 20) fail("The plan exceeds the supported size.");
  // Timeline identity/dates and vendor definitions must match this brief. Statuses and approved budgets may change.
  const baseline = generatePlan(r.brief, r.plan.referenceDate);
  for (const section of ["timeline", "vendors"] as const) {
    if (baseline[section].length !== r.plan[section].length || baseline[section].some(t => !r.plan[section].some(v => v.id === t.id && v.title === t.title))) fail("Plan tasks do not belong to this event category.");
  }
  if (baseline.timeline.some(t => !r.plan.timeline.some(v => v.id === t.id && v.originalDueDate === t.originalDueDate))) fail("Timeline does not match the event date.");
  if (r.operation === "optimize" && (new Set(r.protectedCategories).size !== r.protectedCategories.length || r.protectedCategories.some(k => !profile.some(p => p.key === k)))) fail("Choose distinct protected categories from this event.");
});
function contextRecord(r: { brief: z.infer<typeof briefSchema>; plan: z.infer<typeof planSchema> }) { return { brief: r.brief, plan: r.plan }; }
export type AIRequest = z.infer<typeof requestSchema>;
export type OptimizeRequest = Extract<AIRequest, { operation: "optimize" }>;
export function responseSchema(operation: AIRequest["operation"]) { return operation === "recommendations" ? recommendationsSchema : operation === "optimize" ? optimizationSchema : questionSchema; }
export function parseOutput(raw: string, request: AIRequest) {
  if (!raw.trim() || raw.length > AI_LIMITS.outputChars) throw new Error("Invalid output size");
  const output = responseSchema(request.operation).parse(JSON.parse(raw));
  const keys = new Set(request.plan.budget.map(b => b.category));
  const references = "guidance" in output ? output.guidance : "ideas" in output ? output.ideas : [];
  if (references.some(i => !keys.has(i.category)) || ("guidance" in output && new Set(output.guidance.map(g => g.category)).size !== output.guidance.length)) throw new Error("Invalid category references");
  return output;
}
