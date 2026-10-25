import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { AI_LIMITS } from "./src/lib/ai/limits";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["smoke/**/*.smoke.ts"], environment: "node", env: { NODE_ENV: "production" }, reporters: ["verbose"], fileParallelism: false, maxWorkers: 1, testTimeout: AI_LIMITS.requestTimeoutMs + 10_000, sequence: { concurrent: false } },
});
