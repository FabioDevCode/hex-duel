import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  passWithNoTests: true,
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:3000",
  },
});
