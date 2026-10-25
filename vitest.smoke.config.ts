import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["smoke/**/*.smoke.ts"], environment: "node", env: { NODE_ENV: "production" }, reporters: ["verbose"], fileParallelism: false, maxWorkers: 1, testTimeout: 80_000 /* above the 70-second HTTP deadline */, sequence: { concurrent: false } },
});
