import { pgTable, uuid, varchar, timestamp, integer, primaryKey, index } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: varchar("display_name", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const playerSessions = pgTable(
  "player_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [index("player_sessions_token_hash_idx").on(table.tokenHash)],
);

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerOneId: uuid("player_one_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  playerTwoId: uuid("player_two_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  winnerId: uuid("winner_id").references(() => players.id, { onDelete: "set null" }),
  status: varchar("status", { length: 16 }).notNull(),
  turnCount: integer("turn_count").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  finishReason: varchar("finish_reason", { length: 32 }),
});

export const matchPlayerResults = pgTable(
  "match_player_results",
  {
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    finalHp: integer("final_hp").notNull(),
    result: varchar("result", { length: 8 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.matchId, table.playerId] })],
);
