import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  passWithNoTests: true,
  fullyParallel: false,
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: [
    {
      command: "pnpm --filter @hex-duel/server dev",
      port: 2567,
      timeout: 30_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter @hex-duel/web dev",
      port: 3000,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
