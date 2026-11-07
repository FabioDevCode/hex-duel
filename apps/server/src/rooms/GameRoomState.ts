import { schema, t, type SchemaType } from "@colyseus/schema";

export const GroundBonusSchema = schema(
  {
    id: t.string().default(""),
    type: t.string().default("REGEN"),
    x: t.number().default(0),
    z: t.number().default(0),
    spawnTurn: t.uint8().default(0),
  },
  "GroundBonusSchema",
);
export type GroundBonusSchema = SchemaType<typeof GroundBonusSchema>;

export const PlayerSchema = schema(
  {
    seat: t.uint8().default(0),
    id: t.string().default(""),
    pseudonym: t.string().default(""),
    /** Armed bonus type, "" when none (public display data, D-134). */
    armedBonus: t.string().default(""),
    x: t.number().default(0),
    z: t.number().default(0),
    crystals: t.uint8().default(0),
    isAlive: t.boolean().default(true),
    connected: t.boolean().default(true),
    hasValidated: t.boolean().default(false),
  },
  "PlayerSchema",
);
export type PlayerSchema = SchemaType<typeof PlayerSchema>;

export const GameRoomState = schema(
  {
    status: t.string().default("WAITING"),
    turnNumber: t.uint8().default(0),
    turnDeadlineAt: t.number().default(0),
    players: t.array(PlayerSchema),
    /** Bonuses lying on the arena (public data, D-134). */
    bonuses: t.array(GroundBonusSchema),
  },
  "GameRoomState",
);
export type GameRoomState = SchemaType<typeof GameRoomState>;
