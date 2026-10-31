import { GAME_CONFIG } from "@hex-duel/shared";
import type { Vector2 } from "@hex-duel/shared";

/**
 * P-001 (PENDING): capsule collision radius is not arbitrated yet.
 * Default proposal: 0.5 units (treated as circles in the X/Z plane per
 * TECHNICAL_SPEC 8.6). Awaiting arbitration; do not treat as validated.
 */
export const DEFAULT_COLLISION_RADIUS = 0.5;

export const getCollisionRadius = (): number =>
  GAME_CONFIG.collisionRadius > 0 ? GAME_CONFIG.collisionRadius : DEFAULT_COLLISION_RADIUS;

export const positionsOverlap = (
  a: Vector2,
  b: Vector2,
  radius: number = getCollisionRadius(),
): boolean => {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const minDistance = radius * 2;
  const EPSILON = 1e-9;
  return Math.sqrt(dx * dx + dz * dz) < minDistance - EPSILON;
};
