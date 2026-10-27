import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
export const sourceSchema = z.enum(["live-ai", "rule-based"]);
export const recommendationSchema = z
  .object({
    title: text(160),
    description: text(1200),
    rationale: text(1000),
    category: text(80),
    nextAction: text(400),
  })
  .strict();
export const riskRecommendationSchema = z
  .object({ risk: text(160), relevance: text(1000), mitigation: text(1000) })
  .strict();
export const guidanceSchema = z
  .object({
    category: text(80),
    action: z.enum(["reduce", "maintain", "increase", "review"]),
    rationale: text(700),
    alternative: text(700),
  })
  .strict();
const common = {
  summary: text(1600),
  assumptions: z.array(text(500)).min(1).max(5),
  nextActions: z.array(text(400)).min(1).max(5),
};
export const recommendationsSchema = z
  .object({
    ...common,
    headline: text(160),
    ideas: z.array(recommendationSchema).min(2).max(6),
    risks: z.array(riskRecommendationSchema).min(1).max(4),
  })
  .strict();
export const optimizationSchema = z
  .object({
    ...common,
    guidance: z.array(guidanceSchema).min(1).max(10),
    tradeoffs: z.array(text(700)).min(1).max(5),
  })
  .strict();
export const questionSchema = z.object({ ...common, answer: text(2400) }).strict();
export const savedIdeaSchema = z
  .object({ idea: recommendationSchema, source: sourceSchema, savedAt: z.iso.datetime() })
  .strict();
export type Recommendation = z.infer<typeof recommendationSchema>;
export type Guidance = z.infer<typeof guidanceSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Recommendations = z.infer<typeof recommendationsSchema>;
export type Optimization = z.infer<typeof optimizationSchema>;
export type QuestionAnswer = z.infer<typeof questionSchema>;
