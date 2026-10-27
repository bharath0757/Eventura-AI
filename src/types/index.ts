import type { z } from "zod";
import type {
  briefSchema,
  planSchema,
  recordSchema,
  statusSchema,
  categoryDetailsSchema,
} from "@/lib/validation/schemas";
import type { categories } from "@/lib/config";
export type Category = (typeof categories)[number];
export type CategoryDetails = z.infer<typeof categoryDetailsSchema>;
export type EventBrief = z.infer<typeof briefSchema>;
export type EventPlan = z.infer<typeof planSchema>;
export type EventRecord = z.infer<typeof recordSchema>;
export type TaskStatus = z.infer<typeof statusSchema>;
export type BudgetItem = EventPlan["budget"][number];
export type TimelineTask = EventPlan["timeline"][number];
export type VendorTask = EventPlan["vendors"][number];
export type PersonalizedIdea = EventPlan["ideas"][number];
export type RiskRecommendation = EventPlan["risks"][number];

/** Compatibility name retained from the Phase 1 foundation. */
export type EventCategory = Category;
