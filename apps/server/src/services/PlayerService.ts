import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../database/client";
import { players } from "../database/schema";

export type PlayerRecord = {
  id: string;
  displayName: string;
};

/**
 * Guest player persistence (D-080). Creates the player row when persistence
 * is configured AND reachable; falls back to an in-memory identity otherwise
 * so the game stays playable without a database (or before migrations are
 * applied). Persistence failures are logged, never thrown.
 */
export const createGuestPlayer = async (): Promise<PlayerRecord> => {
  const id = randomUUID();
  const displayName = `Guest-${id.slice(0, 6)}`;
  const db = getDb();
  if (!db) return { id, displayName };
  try {
    const [row] = await db
      .insert(players)
      .values({ id, displayName })
      .returning({ id: players.id, displayName: players.displayName });
    return row ?? { id, displayName };
  } catch (error: unknown) {
    console.warn(
      "[PlayerService] guest player persistence unavailable, using in-memory identity:",
      error instanceof Error ? error.message : error,
    );
    return { id, displayName };
  }
};

export const findPlayer = async (id: string): Promise<PlayerRecord | null> => {
  const db = getDb();
  if (!db) return null;
  try {
    const [row] = await db
      .select({ id: players.id, displayName: players.displayName })
      .from(players)
      .where(eq(players.id, id))
      .limit(1);
    return row ?? null;
  } catch (error: unknown) {
    console.warn(
      "[PlayerService] findPlayer failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
};
