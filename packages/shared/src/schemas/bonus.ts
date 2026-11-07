import { z } from "zod";
import { BONUS_TYPES } from "../types/bonus";
import { Vector2Schema } from "./messages";

export const BonusTypeSchema = z.enum(BONUS_TYPES);

export const GroundBonusSchema = z.object({
  id: z.string().min(1),
  type: BonusTypeSchema,
  position: Vector2Schema,
  spawnTurn: z.number().int().nonnegative(),
});

export const PickupMethodSchema = z.enum(["POSITION", "TRAJECTORY", "ATTACK"]);

export const BonusEventsSchema = z.object({
  spawned: z.array(GroundBonusSchema),
  pickups: z.array(
    z.object({
      seat: z.union([z.literal(0), z.literal(1)]),
      bonus: GroundBonusSchema,
      method: PickupMethodSchema,
    }),
  ),
  contested: z.array(z.string()),
  expired: z.array(z.string()),
  regen: z.array(
    z.object({
      seat: z.union([z.literal(0), z.literal(1)]),
      crystalsAfter: z.number().int().nonnegative(),
    }),
  ),
  shieldAbsorbed: z.array(
    z.object({ seat: z.union([z.literal(0), z.literal(1)]) }),
  ),
  consumed: z.array(
    z.object({
      seat: z.union([z.literal(0), z.literal(1)]),
      type: BonusTypeSchema,
    }),
  ),
});
