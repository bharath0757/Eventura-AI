import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: [
        "src/lib/planner/**/*.ts",
        "src/lib/validation/**/*.ts",
        "src/lib/storage/**/*.ts",
        "src/lib/ai/**/*.ts",
        "src/lib/dates.ts",
      ],
      // Scoped to critical business logic, measured before setting regression gates.
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 95,
        "src/lib/ai/optimizer.ts": { statements: 95, branches: 90, functions: 100, lines: 100 },
        "src/lib/storage/events.ts": { statements: 95, branches: 90, functions: 100, lines: 100 },
      },
    },
  },
});
