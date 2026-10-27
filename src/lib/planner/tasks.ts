import type { BudgetItem, Category, EventBrief, TimelineTask, VendorTask } from "@/types";
import { addDays } from "@/lib/dates";
import { milestones, vendorTemplates } from "./profiles";

/** Shared task definitions for generation and request validation; no ideas or budgets are regenerated. */
export function buildTimeline(
  brief: Pick<EventBrief, "category" | "date">,
  referenceDate: string,
): TimelineTask[] {
  return milestones[brief.category].map((task) => {
    const originalDueDate = addDays(brief.date, -task.daysBefore);
    const urgent = originalDueDate < referenceDate;
    return {
      id: `timeline-${task.key}`,
      title: task.title,
      description: task.description,
      originalDueDate,
      dueDate: urgent ? referenceDate : originalDueDate,
      urgent,
      priority: task.priority,
      status: "pending",
    };
  });
}
export function buildVendors(category: Category, budget: BudgetItem[]): VendorTask[] {
  const amounts = new Map(budget.map((item) => [item.category, item.amount]));
  return vendorTemplates[category].map((vendor) => ({
    id: `vendor-${vendor.key}`,
    category: vendor.key,
    title: vendor.title,
    description: vendor.description,
    priority: "medium",
    status: "pending",
    ...(vendor.budgetKey ? { estimatedCost: amounts.get(vendor.budgetKey) } : {}),
  }));
}
