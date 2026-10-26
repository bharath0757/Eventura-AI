"use client";

import type { ButtonHTMLAttributes } from "react";
import type { EventCategory } from "@/types";
import { usePlanner } from "@/components/planner/planner-provider";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  action?: "start" | "sample";
  category?: EventCategory;
};

/** Interactive action only; the surrounding marketing content stays on the server. */
export function PlanningAction({ action = "start", category, children, ...props }: Props) {
  const { startPlanning, viewSample } = usePlanner();
  return (
    <button
      type="button"
      {...props}
      onClick={() => (action === "sample" ? viewSample() : startPlanning(category))}
    >
      {children}
    </button>
  );
}
