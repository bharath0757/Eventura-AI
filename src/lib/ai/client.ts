import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { providerConfig } from "./config";
import { AI_LIMITS } from "./limits";
import { buildPrompt, systemInstruction } from "./prompts";
import { responseSchema, type AIRequest } from "./schemas";

export type FailureReason =
  | "missing-key"
  | "configuration"
  | "authentication"
  | "rate-limit"
  | "timeout"
  | "unavailable"
  | "invalid-output";
export class ProviderFailure extends Error {
  constructor(public reason: FailureReason) {
    super(reason);
  }
}

export interface ProviderUsage {
  inputTokens?: number;
  outputTokens?: number;
  thoughtTokens?: number;
}
export type UsageObserver = (usage: ProviderUsage) => void;
export async function generate(
  r: AIRequest,
  signal?: AbortSignal,
  onUsage?: UsageObserver,
): Promise<string> {
  return generateStructured(
    {
      prompt: buildPrompt(r),
      instruction: systemInstruction,
      schema: z.toJSONSchema(responseSchema(r.operation)),
    },
    signal,
    onUsage,
  );
}

/** One bounded provider request, shared without retaining conversations or adding tools. */
export async function generateStructured(
  input: { prompt: string; instruction: string; schema: Record<string, unknown> },
  signal?: AbortSignal,
  onUsage?: UsageObserver,
): Promise<string> {
  const config = providerConfig();
  if (!config.available) throw new ProviderFailure(config.reason);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    if (controller.signal.aborted) throw new ProviderFailure("timeout");
    const ai = new GoogleGenAI({
      apiKey: config.apiKey,
      httpOptions: { timeout: AI_LIMITS.timeoutMs, retryOptions: { attempts: 1 } },
    });
    const pending = (async () => {
      if (
        ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"].includes(config.model)
      ) {
        const result = await ai.interactions.create(
          {
            model: config.model,
            input: input.prompt,
            system_instruction: input.instruction,
            store: false,
            stream: false,
            generation_config: {
              thinking_level: config.model === "gemini-3.5-flash-lite" ? "minimal" : "low",
              max_output_tokens: AI_LIMITS.outputTokens,
            },
            response_format: { type: "text", mime_type: "application/json", schema: input.schema },
          },
          {
            timeout_ms: AI_LIMITS.timeoutMs,
            retries: { strategy: "none" },
            signal: controller.signal,
          },
        );
        if (result.status !== "completed" || !result.output_text?.trim())
          throw new ProviderFailure("invalid-output");
        onUsage?.({
          inputTokens: result.usage?.total_input_tokens,
          outputTokens: result.usage?.total_output_tokens,
          thoughtTokens: result.usage?.total_thought_tokens,
        });
        return result.output_text;
      }
      // Preserve the explicit model override without automatic model switching or extra calls.
      const result = await ai.models.generateContent({
        model: config.model,
        contents: input.prompt,
        config: {
          systemInstruction: input.instruction,
          responseMimeType: "application/json",
          responseJsonSchema: input.schema,
          maxOutputTokens: AI_LIMITS.outputTokens,
          abortSignal: controller.signal,
        },
      });
      if (result.candidates?.[0]?.finishReason !== "STOP" || !result.text?.trim())
        throw new ProviderFailure("invalid-output");
      onUsage?.({
        inputTokens: result.usageMetadata?.promptTokenCount,
        outputTokens: result.usageMetadata?.candidatesTokenCount,
        thoughtTokens: result.usageMetadata?.thoughtsTokenCount,
      });
      return result.text;
    })();
    const result = await Promise.race([
      pending,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new ProviderFailure("timeout"));
        }, AI_LIMITS.timeoutMs);
      }),
    ]);
    if (controller.signal.aborted) throw new ProviderFailure("timeout");
    return result;
  } catch (e) {
    if (e instanceof ProviderFailure) throw e;
    const status = typeof e === "object" && e !== null && "status" in e ? e.status : undefined;
    const name = typeof e === "object" && e !== null && "name" in e ? e.name : undefined;
    const timedOut =
      controller.signal.aborted ||
      status === 408 ||
      status === 504 ||
      ["APIConnectionTimeoutError", "RequestTimeoutError", "TimeoutError", "AbortError"].includes(
        String(name),
      );
    const reason: FailureReason = timedOut
      ? "timeout"
      : status === 401 || status === 403
        ? "authentication"
        : status === 429
          ? "rate-limit"
          : status === 400 || status === 404
            ? "configuration"
            : "unavailable";
    // Fixed labels and numeric status only; never log provider messages, prompts or credentials.
    const knownErrors = [
      "ApiError",
      "APIError",
      "APIConnectionError",
      "APIConnectionTimeoutError",
      "RequestTimeoutError",
      "TimeoutError",
      "AbortError",
      "TypeError",
      "Error",
    ];
    console.warn("Eventura Gemini provider failure", {
      reason,
      httpStatus: typeof status === "number" && status >= 400 && status <= 599 ? status : null,
      errorType: typeof name === "string" && knownErrors.includes(name) ? name : "unknown",
    });
    throw new ProviderFailure(reason);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
