import { beforeEach, describe, expect, it, vi } from "vitest";
import { matchPlayerResults, matches } from "../database/schema";

const MATCH_ID = "3871eb48-293d-490c-938a-1d27f2e1f3c8";
const PLAYER_ONE = "11111111-1111-1111-1111-111111111111";
const PLAYER_TWO = "22222222-2222-2222-2222-222222222222";

type InsertEntry = {
  table: unknown;
  values: Record<string, unknown> | Record<string, unknown>[];
};

const insertCalls: InsertEntry[] = [];
// Set to false to simulate a skipped insert (e.g. a conflicting id).
let matchesInsertSucceeds = true;

const fakeTx = {
  insert: (table: unknown) => {
    const entry: InsertEntry = { table, values: {} };
    insertCalls.push(entry);
    return {
      values: (values: Record<string, unknown> | Record<string, unknown>[]) => {
        entry.values = values;
        return {
          onConflictDoNothing: () => ({
            // Awaited directly (match_player_results) or chained with
            // .returning() (matches).
            then: (resolve: (value: undefined) => void) => resolve(undefined),
            returning: () => (matchesInsertSucceeds ? [{ id: MATCH_ID }] : []),
          }),
        };
      },
    };
  },
};

vi.mock("../database/client", () => ({
  getDb: () => ({
    transaction: async (fn: (tx: typeof fakeTx) => Promise<void>) => fn(fakeTx),
  }),
}));

const loadService = () => import("./ResultService");

const call = (outcome: Parameters<
  Awaited<ReturnType<typeof loadService>>["recordMatchResult"]
>[0]["outcome"]) =>
  loadService().then(({ recordMatchResult }) =>
    recordMatchResult({
      playerOneId: PLAYER_ONE,
      playerTwoId: PLAYER_TWO,
      outcome,
      turnCount: 5,
      finishReason: "COMPLETED",
      startedAtMs: 1_700_000_000_000,
      playerOneHp: 3,
      playerTwoHp: 0,
    }),
  );

describe("recordMatchResult", () => {
  beforeEach(() => {
    insertCalls.length = 0;
    matchesInsertSucceeds = true;
  });

  it("lets the database generate the match id (Colyseus roomIds are not UUIDs)", async () => {
    await call({ outcome: "WIN", winnerPlayerId: PLAYER_ONE });

    const matchInsert = insertCalls.find((entry) => entry.table === matches);
    expect(matchInsert).toBeDefined();
    const values = matchInsert?.values as Record<string, unknown>;
    expect(values.id).toBeUndefined();
    expect(values.playerOneId).toBe(PLAYER_ONE);
    expect(values.playerTwoId).toBe(PLAYER_TWO);
    expect(values.winnerId).toBe(PLAYER_ONE);
  });

  it("links both player results to the generated match id", async () => {
    await call({ outcome: "DRAW" });

    const resultInserts = insertCalls.filter((entry) => entry.table === matchPlayerResults);
    expect(resultInserts).toHaveLength(1);
    const rows = resultInserts[0]?.values as Record<string, unknown>[];
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.matchId).toBe(MATCH_ID);
      expect(row.result).toBe("DRAW");
    }
  });

  it("does not write player results when the match insert is skipped", async () => {
    matchesInsertSucceeds = false;

    await call({ outcome: "DRAW" });

    expect(insertCalls.filter((entry) => entry.table === matchPlayerResults)).toHaveLength(0);
  });
});
