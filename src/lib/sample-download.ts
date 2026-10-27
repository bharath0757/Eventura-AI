import type { SamplePlan, SampleProgress } from "./sample-types";

export function sampleDownload(plan: SamplePlan, progress: SampleProgress): string {
  return [
    "EVENTURA — SAMPLE WEDDING PLAN",
    plan.name,
    plan.dateLabel + " · " + plan.location,
    plan.guests + " guests · " + plan.totalLabel + " budget",
    "",
    "SUGGESTED BUDGET (ESTIMATES)",
    ...plan.budget.map((item) => item.label + ": " + item.amountLabel + " (" + item.percent + "%)"),
    "",
    "PLANNING CHECKLIST",
    ...plan.timeline.map(
      (task) =>
        "[" +
        (progress.completed.includes(task.id) ? "x" : " ") +
        "] " +
        task.title +
        " — " +
        task.when +
        ": " +
        task.detail,
    ),
    "",
    "VENDOR CHECKLIST",
    ...plan.vendors.map((task) => task.title + ": " + (progress.vendors[task.id] || "To research")),
    "",
    "This illustrative sample uses the same transparent planning rules as saved events. Amounts are estimates, not vendor quotes. Sample progress is temporary; create your own event to save a plan.",
  ].join("\n");
}
