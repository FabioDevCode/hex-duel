import { GAME_CONFIG } from "@hex-duel/shared";
import type { Vector2 } from "@hex-duel/shared";

export type MovementError =
  | "OUT_OF_ARENA"
  | "TOO_FAR"
  | "INVALID_TARGET";

export type MovementResult =
  | { ok: true; destination: Vector2 }
  | { ok: false; error: MovementError };

export const isWithinMaxDistance = (from: Vector2, to: Vector2, maxDistance: number = GAME_CONFIG.maxMoveDistance): boolean => {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const EPSILON = 1e-9;
  return Math.sqrt(dx * dx + dz * dz) <= maxDistance + EPSILON;
};

export const calculateMovement = (
  from: Vector2,
  target: Vector2,
  isInsideArena: (position: Vector2) => boolean,
  maxDistance: number = GAME_CONFIG.maxMoveDistance,
): MovementResult => {
  if (!Number.isFinite(target.x) || !Number.isFinite(target.z)) {
    return { ok: false, error: "INVALID_TARGET" };
  }
  if (!isWithinMaxDistance(from, target, maxDistance)) {
    return { ok: false, error: "TOO_FAR" };
  }
  if (!isInsideArena(target)) {
    return { ok: false, error: "OUT_OF_ARENA" };
  }
  return { ok: true, destination: target };
};
