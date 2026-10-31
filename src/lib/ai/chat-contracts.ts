import { z } from "zod";
import { briefSchema, planSchema } from "@/lib/validation/schemas";
import { sourceSchema } from "./contracts";

const text = (max: number) => z.string().trim().min(1).max(max);
export const chatRequestSchema = z
  .object({
    message: text(1000),
    history: z
      .array(z.object({ role: z.enum(["user", "assistant"]), text: text(2400) }).strict())
      .max(8)
      .default([]),
    context: z.object({ brief: briefSchema, plan: planSchema }).strict().optional(),
    purpose: z.enum(["chat", "invitation"]).default("chat"),
  })
  .strict();

export const chatResultSchema = z
  .object({
    reply: text(4000),
    source: sourceSchema,
    message: text(1000),
  })
  .strict();
export type ChatRequest = z.input<typeof chatRequestSchema>;
export type ChatResult = z.infer<typeof chatResultSchema>;
