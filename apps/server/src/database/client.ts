import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Returns the shared Drizzle client. The connection is only created when
 * DATABASE_URL is configured; the server can run without persistence in
 * local development otherwise.
 */
export const getDb = (): ReturnType<typeof drizzle<typeof schema>> | null => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  if (!db) {
    db = drizzle(databaseUrl, { schema });
  }
  return db;
};
