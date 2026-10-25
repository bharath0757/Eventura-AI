import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3046";
export default defineConfig({
  testDir: "./e2e", fullyParallel: false, workers: 1, retries: 0,
  forbidOnly: Boolean(process.env.CI), timeout: 60_000,
  expect: { timeout: 10_000 }, outputDir: "test-results",
  reporter: [["line"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "off", video: "off" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3046",
    url: baseURL, reuseExistingServer: false, timeout: 45_000,
    // An empty explicit key overrides local env files. Never reuse a possibly credentialed server.
    env: { GEMINI_API_KEY: "", GEMINI_MODEL: "", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
