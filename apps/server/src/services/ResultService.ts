import { eq } from "drizzle-orm";
import { getDb } from "../database/client";
import { matchPlayerResults, matches } from "../database/schema";

export type MatchOutcome =
  | { outcome: "WIN"; winnerPlayerId: string }
  | { outcome: "DRAW" }
  | { outcome: "CANCELLED" };

export type MatchRecord = {
  roomId: string;
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
 * Records a finished match exactly once (D-183). The match row is keyed by
 * roomId: a second call with the same roomId is ignored. All writes happen
 * in a single transaction (TECHNICAL_SPEC 11.4).
 */
export const recordMatchResult = async (record: MatchRecord): Promise<void> => {
  const db = getDb();
  if (!db) return;

  const existing = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.id, record.roomId))
    .limit(1);
  if (existing.length > 0) return;

  const winnerId =
    record.outcome.outcome === "WIN" ? record.outcome.winnerPlayerId : null;

  await db.transaction(async (tx) => {
    await tx
      .insert(matches)
      .values({
        id: record.roomId,
        playerOneId: record.playerOneId,
        playerTwoId: record.playerTwoId,
        winnerId,
        status: record.outcome.outcome === "CANCELLED" ? "CANCELLED" : "FINISHED",
        turnCount: record.turnCount,
        startedAt: new Date(record.startedAtMs),
        finishedAt: new Date(),
        finishReason: record.finishReason,
      })
      .onConflictDoNothing();

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
          matchId: record.roomId,
          playerId: record.playerOneId,
          finalHp: record.playerOneHp,
          result: resultFor(record.playerOneId),
        },
        {
          matchId: record.roomId,
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
  const rows = await db
    .select({ result: matchPlayerResults.result })
    .from(matchPlayerResults)
    .where(eq(matchPlayerResults.playerId, playerId));
  const stats: PlayerStats = { matchesPlayed: rows.length, wins: 0, losses: 0, draws: 0 };
  for (const row of rows) {
    if (row.result === "WIN") stats.wins += 1;
    else if (row.result === "LOSS") stats.losses += 1;
    else stats.draws += 1;
  }
  return stats;
};
