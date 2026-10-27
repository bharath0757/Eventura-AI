import "server-only";
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export function providerConfig(env: NodeJS.ProcessEnv = process.env) {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { available: false as const, reason: "missing-key" as const };
  const model = env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  if (!/^gemini-[a-z0-9][a-z0-9.-]{1,100}$/.test(model))
    return { available: false as const, reason: "configuration" as const };
  return { available: true as const, apiKey, model };
}
