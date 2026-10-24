import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { providerConfig } from "./config";
import { AI_LIMITS } from "./limits";
import { buildPrompt, systemInstruction } from "./prompts";
import { responseSchema, type AIRequest } from "./schemas";
export type FailureReason = "missing-key" | "configuration" | "authentication" | "rate-limit" | "timeout" | "unavailable" | "invalid-output";
export class ProviderFailure extends Error { constructor(public reason: FailureReason) { super(reason); } }
export async function generate(r: AIRequest, signal?: AbortSignal): Promise<string> {
  const config = providerConfig();
  if (!config.available) throw new ProviderFailure(config.reason);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const ai = new GoogleGenAI({ apiKey: config.apiKey, httpOptions: { timeout: AI_LIMITS.timeoutMs, retryOptions: { attempts: 1 } } });
    const pending = ai.models.generateContent({ model: config.model, contents: buildPrompt(r), config: { systemInstruction, responseMimeType: "application/json", responseJsonSchema: z.toJSONSchema(responseSchema(r.operation)), maxOutputTokens: AI_LIMITS.outputTokens, abortSignal: controller.signal } });
    const result = await Promise.race([pending, new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new ProviderFailure("timeout")); }, AI_LIMITS.timeoutMs); })]);
    if (controller.signal.aborted) throw new ProviderFailure("timeout");
    if (result.candidates?.[0]?.finishReason !== "STOP" || !result.text?.trim()) throw new ProviderFailure("invalid-output");
    return result.text;
  } catch (e) {
    if (e instanceof ProviderFailure) throw e;
    const status = typeof e === "object" && e !== null && "status" in e ? e.status : undefined;
    throw new ProviderFailure(controller.signal.aborted ? "timeout" : status === 401 || status === 403 ? "authentication" : status === 429 ? "rate-limit" : status === 400 || status === 404 ? "configuration" : "unavailable");
  } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
}
