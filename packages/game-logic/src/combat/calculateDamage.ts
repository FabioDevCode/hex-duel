import { GAME_CONFIG } from "@hex-duel/shared";
import type { AttackType, PlayerState, Seat } from "@hex-duel/shared";
import { checkAttack } from "./calculateAttack";

export type AttackOutcome = {
  attackerSeat: Seat;
  targetSeat: Seat;
  attackType: AttackType;
  hits: boolean;
  crystalsLost: number;
  targetCrystalsAfter: number;
  targetAlive: boolean;
  /** True when the target's armed shield absorbed the hit (D-192). */
  absorbedByShield: boolean;
};

/**
 * A successful attack destroys exactly one crystal. The first player
 * reduced to 0 crystals is eliminated.
 */
export const calculateDamage = (
  attacker: PlayerState,
  target: PlayerState,
  attackType: AttackType,
  direction: number,
  options?: {
    /** Boosted range/angle (armed ATTACK bonus), defaults to the base config. */
    attackParams?: { range: number; angle: number };
    /** The target carries an armed shield: the hit is absorbed. */
    shielded?: boolean;
  },
): AttackOutcome => {
  const params = options?.attackParams ?? GAME_CONFIG.attacks[attackType];
  const check = checkAttack(attacker.position, target.position, { type: attackType, direction }, params);
  const absorbedByShield = check.hits && options?.shielded === true;
  const crystalsLost = check.hits && !absorbedByShield ? 1 : 0;
  const targetCrystalsAfter = Math.max(0, target.crystals - crystalsLost);
  return {
    attackerSeat: attacker.seat,
    targetSeat: target.seat,
    attackType,
    hits: check.hits,
    crystalsLost,
    targetCrystalsAfter,
    targetAlive: targetCrystalsAfter > 0,
    absorbedByShield,
  };
};
