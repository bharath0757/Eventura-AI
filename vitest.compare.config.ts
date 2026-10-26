import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["smoke/**/*.compare.ts"],
    environment: "node",
    env: { NODE_ENV: "production" },
    reporters: ["verbose"],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 900_000,
  },
});
