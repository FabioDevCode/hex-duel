import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../database/client";
import { players } from "../database/schema";

export type PlayerRecord = {
  id: string;
  displayName: string;
};

/**
 * Guest player persistence: creates the player row when persistence is
 * configured, otherwise returns an in-memory identity (D-080).
 */
export const createGuestPlayer = async (): Promise<PlayerRecord> => {
  const db = getDb();
  const id = randomUUID();
  const displayName = `Guest-${id.slice(0, 6)}`;
  if (!db) return { id, displayName };
  const [row] = await db
    .insert(players)
    .values({ id, displayName })
    .returning({ id: players.id, displayName: players.displayName });
  return row ?? { id, displayName };
};

export const findPlayer = async (id: string): Promise<PlayerRecord | null> => {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select({ id: players.id, displayName: players.displayName })
    .from(players)
    .where(eq(players.id, id))
    .limit(1);
  return row ?? null;
};
