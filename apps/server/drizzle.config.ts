import { defineConfig } from "drizzle-kit";

// The .env file lives at the monorepo root; pnpm scripts run from apps/server.
try {
  process.loadEnvFile("../../.env");
} catch {
  // No .env found: rely on the ambient environment (CI, production).
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schema.ts",
  out: "./src/database/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
