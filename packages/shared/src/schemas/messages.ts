import { z } from "zod";

export const Vector2Schema = z.object({
  x: z.number().finite(),
  z: z.number().finite(),
});

export const SeatSchema = z.union([z.literal(0), z.literal(1)]);

export const AttackTypeSchema = z.enum(["SWEEP", "STRIKE", "SNIPER"]);

export const MoveActionSchema = z.object({
  type: z.literal("MOVE"),
  target: Vector2Schema,
});

export const AttackActionSchema = z.object({
  type: AttackTypeSchema,
  direction: z.number().finite(),
});

export const PassActionSchema = z.object({
  type: z.literal("PASS"),
});

export const PlayerActionSchema = z.discriminatedUnion("type", [
  MoveActionSchema,
  AttackActionSchema,
  PassActionSchema,
]);

export const SubmitActionMessageSchema = z.object({
  type: z.literal("submit_action"),
  actionId: z.string().min(1),
  action: PlayerActionSchema,
});

export const CancelMatchmakingMessageSchema = z.object({
  type: z.literal("cancel_matchmaking"),
});

export const RequestRoomInfoMessageSchema = z.object({
  type: z.literal("request_room_info"),
});

export const PingMessageSchema = z.object({
  type: z.literal("ping"),
});

export const ClientMessageSchema = z.discriminatedUnion("type", [
  SubmitActionMessageSchema,
  CancelMatchmakingMessageSchema,
  RequestRoomInfoMessageSchema,
  PingMessageSchema,
]);
