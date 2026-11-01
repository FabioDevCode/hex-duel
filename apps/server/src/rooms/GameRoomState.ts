import { schema, t, type SchemaType } from "@colyseus/schema";

export const PlayerSchema = schema(
  {
    seat: t.uint8().default(0),
    id: t.string().default(""),
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
  },
  "GameRoomState",
);
export type GameRoomState = SchemaType<typeof GameRoomState>;
