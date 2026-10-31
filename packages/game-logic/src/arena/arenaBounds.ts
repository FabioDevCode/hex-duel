import { GAME_CONFIG } from "@hex-duel/shared";
import type { Vector2 } from "@hex-duel/shared";

/**
 * P-002 (PENDING): hexagon orientation is not arbitrated yet.
 * Default proposal: pointy-top regular hexagon (vertex at angle 90 degrees
 * in the X/Z plane), centered at the origin.
 * Awaiting arbitration; do not treat as validated.
 */
export const ARENA_ORIENTATION_OFFSET_DEG = 90;

const degToRad = (deg: number): number => (deg * Math.PI) / 180;

export type HexEdge = {
  outwardNormal: Vector2;
  distanceFromCenter: number;
};

export type ArenaBounds = {
  center: Vector2;
  circumradius: number;
  edges: HexEdge[];
};

/**
 * P-003 (PENDING): the definitive geometric validation formula is not
 * arbitrated yet. Default proposal: a point lies inside the arena iff it is
 * on the inner side of every edge half-plane (sign of all 6 edge normals).
 * Awaiting arbitration; do not treat as validated.
 */
export const buildArenaBounds = (
  circumradius: number = GAME_CONFIG.arenaRadius,
  orientationOffsetDeg: number = ARENA_ORIENTATION_OFFSET_DEG,
): ArenaBounds => {
  const edges: HexEdge[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = orientationOffsetDeg + 60 * i;
    const rad = degToRad(angleDeg);
    edges.push({
      outwardNormal: { x: Math.cos(rad), z: Math.sin(rad) },
      distanceFromCenter: circumradius * Math.cos(degToRad(30)),
    });
  }
  return { center: { x: 0, z: 0 }, circumradius, edges };
};

export const isInsideArena = (position: Vector2, bounds: ArenaBounds): boolean => {
  const EPSILON = 1e-9;
  return bounds.edges.every((edge) => {
    const projection =
      position.x * edge.outwardNormal.x + position.z * edge.outwardNormal.z;
    return projection <= edge.distanceFromCenter + EPSILON;
  });
};
