import { GAME_CONFIG } from "@hex-duel/shared";
import type { PlayerAction, PlayerState, Vector2 } from "@hex-duel/shared";
import { calculateMovement, type MovementError } from "./calculateMovement";

export type MovementOutcome =
  | { moved: true; players: [PlayerState, PlayerState] }
  | { moved: false; reason: MovementError | "COLLISION" };

export const resolveMovement = (
  players: readonly [PlayerState, PlayerState],
  actions: readonly [PlayerAction, PlayerAction],
  isInsideArena: (position: Vector2) => boolean,
  positionsOverlap: (a: Vector2, b: Vector2) => boolean,
  maxDistances?: readonly [number, number],
): MovementOutcome => {
  const finalPositions: [Vector2, Vector2] = [players[0].position, players[1].position];

  for (const seat of [0, 1] as const) {
    const action = actions[seat];
    if (action.type === "MOVE") {
      const maxDistance = maxDistances?.[seat] ?? GAME_CONFIG.maxMoveDistance;
      const result = calculateMovement(players[seat].position, action.target, isInsideArena, maxDistance);
      if (!result.ok) {
        return { moved: false, reason: result.error };
      }
      finalPositions[seat] = result.destination;
    }
  }

  if (
    finalPositions[0].x !== players[0].position.x ||
    finalPositions[0].z !== players[0].position.z ||
    finalPositions[1].x !== players[1].position.x ||
    finalPositions[1].z !== players[1].position.z
  ) {
    if (positionsOverlap(finalPositions[0], finalPositions[1])) {
      return { moved: false, reason: "COLLISION" };
    }
  }

  return {
    moved: true,
    players: [
      { ...players[0], position: finalPositions[0] },
      { ...players[1], position: finalPositions[1] },
    ],
  };
};
