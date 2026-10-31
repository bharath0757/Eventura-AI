import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["smoke/utsav.live.ts"],
    environment: "node",
    testTimeout: 225000,
    fileParallelism: false,
    maxWorkers: 1,
  },
});
