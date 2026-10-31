import { eq } from "drizzle-orm";
import { getDb } from "../database/client";
import { matchPlayerResults, matches } from "../database/schema";

export type MatchOutcome =
  | { outcome: "WIN"; winnerPlayerId: string }
  | { outcome: "DRAW" }
  | { outcome: "CANCELLED" };

export type MatchRecord = {
  playerOneId: string;
  playerTwoId: string;
  outcome: MatchOutcome;
  turnCount: number;
  finishReason: string;
  startedAtMs: number;
  playerOneHp: number;
  playerTwoHp: number;
};

/**
 * Records a finished match exactly once (D-183). The caller (GameRoom)
 * guarantees a single call per finished room via its own resultRecorded
 * flag; the match id is a database-generated UUID (the Colyseus roomId is
 * not a UUID). All writes happen in a single transaction
 * (TECHNICAL_SPEC 11.4).
 */
export const recordMatchResult = async (record: MatchRecord): Promise<void> => {
  const db = getDb();
  if (!db) return;
  try {
    await recordMatchResultInner(db, record);
  } catch (error: unknown) {
    console.warn(
      "[ResultService] match persistence unavailable:",
      error instanceof Error ? error.message : error,
    );
  }
};

const recordMatchResultInner = async (
  db: NonNullable<ReturnType<typeof getDb>>,
  record: MatchRecord,
): Promise<void> => {
  const winnerId =
    record.outcome.outcome === "WIN" ? record.outcome.winnerPlayerId : null;

  await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(matches)
      .values({
        playerOneId: record.playerOneId,
        playerTwoId: record.playerTwoId,
        winnerId,
        status: record.outcome.outcome === "CANCELLED" ? "CANCELLED" : "FINISHED",
        turnCount: record.turnCount,
        startedAt: new Date(record.startedAtMs),
        finishedAt: new Date(),
        finishReason: record.finishReason,
      })
      .onConflictDoNothing()
      .returning({ id: matches.id });
    if (!inserted) return;

    const resultFor = (playerId: string): "WIN" | "LOSS" | "DRAW" => {
      if (record.outcome.outcome === "DRAW") return "DRAW";
      if (record.outcome.outcome === "WIN") {
        return playerId === record.outcome.winnerPlayerId ? "WIN" : "LOSS";
      }
      return "DRAW";
    };

    await tx
      .insert(matchPlayerResults)
      .values([
        {
          matchId: inserted.id,
          playerId: record.playerOneId,
          finalHp: record.playerOneHp,
          result: resultFor(record.playerOneId),
        },
        {
          matchId: inserted.id,
          playerId: record.playerTwoId,
          finalHp: record.playerTwoHp,
          result: resultFor(record.playerTwoId),
        },
      ])
      .onConflictDoNothing();
  });
};

export type PlayerStats = {
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
};

export const getPlayerStats = async (playerId: string): Promise<PlayerStats | null> => {
  const db = getDb();
  if (!db) return null;
  let rows: { result: string }[];
  try {
    rows = await db
      .select({ result: matchPlayerResults.result })
      .from(matchPlayerResults)
      .where(eq(matchPlayerResults.playerId, playerId));
  } catch (error: unknown) {
    console.warn(
      "[ResultService] stats unavailable:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
  const stats: PlayerStats = { matchesPlayed: rows.length, wins: 0, losses: 0, draws: 0 };
  for (const row of rows) {
    if (row.result === "WIN") stats.wins += 1;
    else if (row.result === "LOSS") stats.losses += 1;
    else stats.draws += 1;
  }
  return stats;
};
