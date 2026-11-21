import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 0.0.0.0",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
