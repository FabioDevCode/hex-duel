import { GAME_CONFIG } from "./config";

/**
 * Bonus gameplay values (D-191..D-199). The rules are ACCEPTED; the numeric
 * values are PROPOSED pending balancing (D-199) - do not treat as final.
 */
export const BONUS_CONFIG = {
  /** Radius around a bonus in which a player picks it up (PROPOSED):
   * matches the delimited ground zone shown by the marker. */
  pickupRadius: 1.3,
  /** Ground lifetime: the spawn turn + this many extra turns. */
  groundLifetimeTurns: 1,
  /** Maximum bonuses lying on the arena at once. */
  maxOnGround: 2,
  /** Spawn window (inclusive), one spawn max per turn. */
  firstSpawnTurnMin: 2,
  firstSpawnTurnMax: 3,
  lastSpawnTurn: 22,
  /** Quantities drawn per game (inclusive ranges). */
  quantities: {
    REGEN: { min: 1, max: 2 },
    ATTACK: { min: 3, max: 4 },
    MOVE: { min: 3, max: 5 },
    SHIELD: { min: 2, max: 2 },
  },
  /** Boosted values applied while the bonus is armed (one action). */
  boosted: {
    moveDistance: 7,
    attacks: {
      STRIKE: { range: 8, angle: 180 },
      SNIPER: { range: 12, angle: 25 },
    },
  },
} as const;

/** Base values, kept next to the boosted ones for readability. */
export const BASE_CONFIG = {
  moveDistance: GAME_CONFIG.maxMoveDistance,
  attacks: GAME_CONFIG.attacks,
} as const;
