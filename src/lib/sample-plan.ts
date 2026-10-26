import "server-only";
import { generatePlan } from "@/lib/planner";
import { formatDate, money } from "@/lib/dates";
import type { EventBrief } from "@/types";
import type { SamplePlan } from "./sample-types";

/** Fixed illustrative dates keep the preview deterministic across server renders and hydration. */
export const SAMPLE_REFERENCE_DATE = "2026-10-25";
export const SAMPLE_BRIEF: EventBrief = {
  category: "wedding",
  name: "A day to remember",
  date: "2027-02-14",
  location: "Bengaluru",
  guests: 150,
  budget: 500000,
  details: { category: "wedding", ceremonyStyle: "fusion", theme: "Garden & romantic" },
  priorities: ["Food quality", "Photography"],
  dietary: "",
  accessibility: "",
  notes: "",
};

export function createSamplePlan(): SamplePlan {
  const plan = generatePlan(SAMPLE_BRIEF, SAMPLE_REFERENCE_DATE);
  const colors = [
    "#416655",
    "#dca78a",
    "#9eaf98",
    "#e7c866",
    "#a5a7c7",
    "#afba9c",
    "#c9b4a1",
    "#e7e8df",
  ];
  return {
    name: SAMPLE_BRIEF.name,
    categoryLabel: "Wedding",
    dateLabel: formatDate(SAMPLE_BRIEF.date),
    location: SAMPLE_BRIEF.location,
    guests: SAMPLE_BRIEF.guests,
    total: SAMPLE_BRIEF.budget,
    totalLabel: money(SAMPLE_BRIEF.budget),
    reserveLabel: money(
      plan.budget.filter((item) => item.contingency).reduce((sum, item) => sum + item.amount, 0),
    ),
    budget: plan.budget.map((item, index) => ({
      id: item.id,
      label: item.label,
      percent: item.percentage,
      amount: item.amount,
      amountLabel: money(item.amount),
      color: colors[index % colors.length],
    })),
    timeline: plan.timeline.map((task) => ({
      id: task.id,
      title: task.title,
      detail: task.description,
      when: formatDate(task.dueDate),
    })),
    vendors: plan.vendors.map((task) => ({
      id: task.id,
      title: task.title,
      detail: task.description,
    })),
  };
}
