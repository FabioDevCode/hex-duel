import { GAME_CONFIG } from "@hex-duel/shared";
import type { AttackType, PlayerState, Seat } from "@hex-duel/shared";
import { checkAttack } from "./calculateAttack";

export type AttackOutcome = {
  attackerSeat: Seat;
  targetSeat: Seat;
  attackType: AttackType;
  hits: boolean;
  damage: number;
  targetHpAfter: number;
  targetAlive: boolean;
};

export const calculateDamage = (
  attacker: PlayerState,
  target: PlayerState,
  attackType: AttackType,
  direction: number,
): AttackOutcome => {
  const params = GAME_CONFIG.attacks[attackType];
  const check = checkAttack(attacker.position, target.position, { type: attackType, direction }, params);
  const damage = check.hits ? params.damage : 0;
  const targetHpAfter = Math.max(0, target.hp - damage);
  return {
    attackerSeat: attacker.seat,
    targetSeat: target.seat,
    attackType,
    hits: check.hits,
    damage,
    targetHpAfter,
    targetAlive: targetHpAfter > 0,
  };
};
