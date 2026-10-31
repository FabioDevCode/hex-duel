import type { AttackType, Vector2 } from "@hex-duel/shared";

const normalizeRad = (rad: number): number => {
  let normalized = rad;
  while (normalized > Math.PI) normalized -= 2 * Math.PI;
  while (normalized < -Math.PI) normalized += 2 * Math.PI;
  return normalized;
};

export const distanceBetween = (a: Vector2, b: Vector2): number => {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
};

/**
 * Angle between the attack direction (degrees, 0 = +X axis, CCW in X/Z plane)
 * and the vector from attacker to target.
 */
export const angleBetweenDeg = (from: Vector2, to: Vector2, attackDirectionDeg: number): number => {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (dx === 0 && dz === 0) return 0;
  const targetAngleDeg = (Math.atan2(dz, dx) * 180) / Math.PI;
  return Math.abs(normalizeRad(((targetAngleDeg - attackDirectionDeg) * Math.PI) / 180)) * (180 / Math.PI);
};

export type AttackCheck = {
  inRange: boolean;
  inAngle: boolean;
  hits: boolean;
  distance: number;
  angleDelta: number;
};

export const checkAttack = (
  attackerPosition: Vector2,
  targetPosition: Vector2,
  attack: { type: AttackType; direction: number },
  attackParams: { range: number; angle: number },
): AttackCheck => {
  const distance = distanceBetween(attackerPosition, targetPosition);
  const angleDelta = angleBetweenDeg(attackerPosition, targetPosition, attack.direction);
  const EPSILON = 1e-9;
  const inRange = distance <= attackParams.range + EPSILON;
  // attackParams.angle is the total cone opening; target must be within half of it.
  const inAngle = angleDelta <= attackParams.angle / 2 + EPSILON;
  return { inRange, inAngle, hits: inRange && inAngle, distance, angleDelta };
};
