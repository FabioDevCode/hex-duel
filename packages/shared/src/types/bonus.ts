import type { Vector2 } from "./geometry";

/** The four bonus types (D-192). */
export const BONUS_TYPES = ["REGEN", "ATTACK", "MOVE", "SHIELD"] as const;
export type BonusType = (typeof BONUS_TYPES)[number];

/** A bonus lying on the arena, as exposed in the public state. */
export type GroundBonus = {
  id: string;
  type: BonusType;
  position: Vector2;
  spawnTurn: number;
};

/** How a bonus was picked up this turn. */
export type PickupMethod = "POSITION" | "TRAJECTORY" | "ATTACK";

/** Bonus events of one resolved turn (public data, sent with turn_resolved). */
export type BonusEvents = {
  spawned: GroundBonus[];
  pickups: { seat: 0 | 1; bonusId: string; type: BonusType; method: PickupMethod }[];
  contested: string[];
  expired: string[];
  regen: { seat: 0 | 1; crystalsAfter: number }[];
  shieldAbsorbed: { seat: 0 | 1 }[];
  consumed: { seat: 0 | 1; type: BonusType }[];
};
