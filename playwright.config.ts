import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,          // 60s per test — platform checks can take up to 8s each
  expect: { timeout: 30_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,   // reuse if already running, otherwise start one
    timeout: 120_000,
  },
});
