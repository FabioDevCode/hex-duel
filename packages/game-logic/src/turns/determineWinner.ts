import { GAME_CONFIG } from "@hex-duel/shared";
import type { PlayerState, Seat } from "@hex-duel/shared";

export const determineWinner = (
  players: readonly [PlayerState, PlayerState],
  turnNumber: number,
): { finished: boolean; result: { outcome: "WIN"; winnerSeat: Seat } | { outcome: "DRAW" } | null } => {
  const [p0, p1] = players;
  const p0Alive = p0.isAlive && p0.crystals > 0;
  const p1Alive = p1.isAlive && p1.crystals > 0;

  if (!p0Alive && !p1Alive) {
    return { finished: true, result: { outcome: "DRAW" } };
  }
  if (!p0Alive) {
    return { finished: true, result: { outcome: "WIN", winnerSeat: 1 } };
  }
  if (!p1Alive) {
    return { finished: true, result: { outcome: "WIN", winnerSeat: 0 } };
  }
  if (turnNumber >= GAME_CONFIG.maxTurns) {
    if (p0.crystals === p1.crystals) {
      return { finished: true, result: { outcome: "DRAW" } };
    }
    return {
      finished: true,
      result: { outcome: "WIN", winnerSeat: p0.crystals > p1.crystals ? 0 : 1 },
    };
  }
  return { finished: false, result: null };
};
