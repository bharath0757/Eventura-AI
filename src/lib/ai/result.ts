import { z } from "zod";
import {
  recommendationsSchema,
  optimizationSchema,
  questionSchema,
  sourceSchema,
} from "./contracts";
import { proposalSchema } from "./optimizer";
const status = { source: sourceSchema, message: z.string().min(1).max(500) };
export const resultSchema = z.discriminatedUnion("operation", [
  z
    .object({ ...status, operation: z.literal("recommendations"), data: recommendationsSchema })
    .strict(),
  z.object({ ...status, operation: z.literal("ask"), data: questionSchema }).strict(),
  z
    .object({
      ...status,
      operation: z.literal("optimize"),
      data: optimizationSchema,
      proposal: proposalSchema,
    })
    .strict(),
]);
export type AIResult = z.infer<typeof resultSchema>;
