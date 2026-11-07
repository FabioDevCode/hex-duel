import { BONUS_CONFIG } from "@hex-duel/shared";
import type { AttackType, GroundBonus, PickupMethod, PlayerAction, Vector2 } from "@hex-duel/shared";
import { checkAttack } from "../combat/calculateAttack";

/** Distance from a point to the segment [a, b]. */
export const segmentDistance = (a: Vector2, b: Vector2, point: Vector2): number => {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const apx = point.x - a.x;
  const apz = point.z - a.z;
  const lengthSquared = abx * abx + abz * abz;
  if (lengthSquared === 0) {
    return Math.hypot(apx, apz);
  }
  const t = Math.max(0, Math.min(1, (apx * abx + apz * abz) / lengthSquared));
  const cx = a.x + abx * t;
  const cz = a.z + abz * t;
  return Math.hypot(point.x - cx, point.z - cz);
};

const withinPickupRadius = (distance: number): boolean =>
  distance <= BONUS_CONFIG.pickupRadius + 1e-9;

/**
 * The first pickup method that matches, in a deterministic order:
 * final position, then movement trajectory, then attack zone.
 */
export const pickupMethod = (
  bonus: GroundBonus,
  start: Vector2,
  end: Vector2,
  moved: boolean,
  action: PlayerAction,
  attackParams: { type: AttackType; range: number; angle: number } | null,
): PickupMethod | null => {
  if (withinPickupRadius(Math.hypot(end.x - bonus.position.x, end.z - bonus.position.z))) {
    return "POSITION";
  }
  if (moved && action.type === "MOVE") {
    if (withinPickupRadius(segmentDistance(start, end, bonus.position))) {
      return "TRAJECTORY";
    }
  }
  if (attackParams && (action.type === "STRIKE" || action.type === "SNIPER")) {
    const covered = checkAttack(
      start,
      bonus.position,
      { type: attackParams.type, direction: action.direction },
      { range: attackParams.range, angle: attackParams.angle },
    );
    if (covered.hits) return "ATTACK";
  }
  return null;
};
