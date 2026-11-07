import { BONUS_CONFIG, BONUS_TYPES } from "@hex-duel/shared";
import type { BonusType, GroundBonus, Vector2 } from "@hex-duel/shared";
import { drawDistinctInts, drawInt, deriveSeed, mulberry32, shuffle } from "./seededRandom";

/** One scheduled appearance: type + turn (position computed at spawn time). */
export type ScheduledSpawn = {
  id: string;
  type: BonusType;
  turn: number;
};

/**
 * Deterministic bonus schedule (D-197): quantities are drawn first
 * (REGEN 1-2, ATTACK 3-4, MOVE 3-5, SHIELD 2), then distinct spawn turns
 * (first bonus on turn 2 or 3, last possible on turn 22, one spawn max
 * per turn). Same seed -> same schedule.
 */
export const generateBonusSchedule = (seed: number): ScheduledSpawn[] => {
  const rng = mulberry32(seed);
  const counts: Record<BonusType, number> = {
    REGEN: drawInt(rng, BONUS_CONFIG.quantities.REGEN.min, BONUS_CONFIG.quantities.REGEN.max),
    ATTACK: drawInt(rng, BONUS_CONFIG.quantities.ATTACK.min, BONUS_CONFIG.quantities.ATTACK.max),
    MOVE: drawInt(rng, BONUS_CONFIG.quantities.MOVE.min, BONUS_CONFIG.quantities.MOVE.max),
    SHIELD: BONUS_CONFIG.quantities.SHIELD.min,
  };

  const pool: BonusType[] = [];
  for (const type of BONUS_TYPES) {
    for (let i = 0; i < counts[type]; i++) pool.push(type);
  }

  const firstTurn = drawInt(rng, BONUS_CONFIG.firstSpawnTurnMin, BONUS_CONFIG.firstSpawnTurnMax);
  const remainingTurns = drawDistinctInts(
    rng,
    firstTurn + 1,
    BONUS_CONFIG.lastSpawnTurn,
    pool.length - 1,
  );
  const turns = [firstTurn, ...remainingTurns].sort((a, b) => a - b);
  const types = shuffle(rng, pool);

  const schedule = turns.map((turn, index) => ({
    id: `bonus-${turn}-${index}`,
    type: types[index]!,
    turn,
  }));

  // The first bonus to appear is never a crystal (REGEN): swap it
  // deterministically with the first non-REGEN entry if needed.
  if (schedule[0]?.type === "REGEN") {
    const swapIndex = schedule.findIndex((spawn, index) => index > 0 && spawn.type !== "REGEN");
    const swap = schedule[swapIndex];
    if (swapIndex > 0 && swap) {
      const first = schedule[0]!;
      schedule[0] = { ...first, type: swap.type };
      schedule[swapIndex] = { ...swap, type: first.type };
    }
  }

  return schedule;
};

/**
 * Spawn position, computed at the spawn turn with the same seed and with
 * spatial fairness: among deterministic candidates inside the arena, the
 * one minimizing |distance to player 0 - distance to player 1| wins.
 */
export const computeBonusPosition = (
  seed: number,
  spawnId: string,
  playerPositions: readonly [Vector2, Vector2],
  isInsideArena: (position: Vector2) => boolean,
): Vector2 => {
  const rng = mulberry32(deriveSeed(seed, spawnId));
  let best: Vector2 | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let i = 0; i < 24; i++) {
    const candidate: Vector2 = { x: rng() * 20 - 10, z: rng() * 20 - 10 };
    if (!isInsideArena(candidate)) continue;
    const d0 = Math.hypot(candidate.x - playerPositions[0].x, candidate.z - playerPositions[0].z);
    const d1 = Math.hypot(candidate.x - playerPositions[1].x, candidate.z - playerPositions[1].z);
    const score = Math.abs(d0 - d1);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best ?? { x: 0, z: 0 };
};

/** Builds the GroundBonus for a scheduled spawn at its turn. */
export const instantiateGroundBonus = (
  spawn: ScheduledSpawn,
  position: Vector2,
): GroundBonus => ({
  id: spawn.id,
  type: spawn.type,
  position,
  spawnTurn: spawn.turn,
});
