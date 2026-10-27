import "server-only";
import { generate, ProviderFailure, type FailureReason, type UsageObserver } from "./client";
import { requestSchema, parseOutput, type AIRequest } from "./schemas";
import { localAnswer, localOptimization, localRecommendations } from "./fallback";
import { recommendationsSchema, optimizationSchema, questionSchema } from "./contracts";
import { optimizeBudget } from "./optimizer";
import { resultSchema, type AIResult } from "./result";
const messages: Record<FailureReason, string> = {
  "missing-key": "Live AI is not configured. These suggestions use rule-based planning.",
  configuration: "Live AI configuration is unavailable. These suggestions use rule-based planning.",
  authentication: "Live AI could not authenticate. These suggestions use rule-based planning.",
  "rate-limit":
    "The AI provider's rate or quota limit was reached. These suggestions use rule-based planning.",
  timeout: "Live AI took too long. These suggestions use rule-based planning.",
  unavailable: "Live AI is temporarily unavailable. These suggestions use rule-based planning.",
  "invalid-output":
    "Live AI returned an unusable response. These suggestions use rule-based planning.",
};
export async function assist(
  input: AIRequest,
  signal?: AbortSignal,
  onUsage?: UsageObserver,
): Promise<AIResult> {
  const r = requestSchema.parse(input);
  // Reject infeasible constraints before spending provider tokens.
  if (r.operation === "optimize") optimizeBudget(r, []);
  let data: ReturnType<typeof parseOutput> | undefined;
  let source: "live-ai" | "rule-based" = "live-ai",
    message = "AI-generated with live Google Gemini. Review suggestions before acting.";
  try {
    const raw = await generate(r, signal, onUsage);
    try {
      data = parseOutput(raw, r);
    } catch {
      throw new ProviderFailure("invalid-output");
    }
  } catch (e) {
    source = "rule-based";
    message = messages[e instanceof ProviderFailure ? e.reason : "unavailable"];
  }
  if (r.operation === "recommendations") {
    return resultSchema.parse({
      operation: r.operation,
      source,
      message,
      data: data ? recommendationsSchema.parse(data) : localRecommendations(r),
    });
  }
  if (r.operation === "ask")
    return resultSchema.parse({
      operation: r.operation,
      source,
      message,
      data: data ? questionSchema.parse(data) : localAnswer(r),
    });
  const guidance = data ? optimizationSchema.parse(data) : localOptimization(r);
  return resultSchema.parse({
    operation: r.operation,
    source,
    message,
    data: guidance,
    proposal: optimizeBudget(r, guidance.guidance),
  });
}
