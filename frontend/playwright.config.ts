import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./test",
  testMatch: "*.browser.spec.ts",
  workers: 1,
  use: {
    baseURL: "http://localhost:3015",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node test/backend-fixture.mjs",
      url: "http://127.0.0.1:4015/api/products",
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: "npm run dev -- --port 3015",
      url: "http://localhost:3015/login",
      env: {
        KOTONG_E2E: "1",
        KOTONG_API_URL: "http://127.0.0.1:4015",
        SESSION_SECRET: "kotong-browser-test-session-secret-32-characters",
      },
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
