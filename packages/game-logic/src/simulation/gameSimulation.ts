import type { PlayerAction, PlayerState, Seat } from "@hex-duel/shared";
import { resolveTurn, type TurnResolution, type ValidationOrder } from "../turns/resolveTurn";

export type SimulatedTurn = {
  actions: Readonly<Record<Seat, PlayerAction>>;
  validationOrders: ValidationOrder;
};

/**
 * Deterministic simulation: given the same initial state and the same
 * sequence of actions, always produces the same result (§8.8).
 * No wall-clock time, no randomness, no browser state.
 */
export const simulateGame = (
  initialPlayers: readonly [PlayerState, PlayerState],
  turns: readonly SimulatedTurn[],
): { players: [PlayerState, PlayerState]; turns: TurnResolution[]; finished: boolean } => {
  let players: [PlayerState, PlayerState] = [initialPlayers[0], initialPlayers[1]];
  const resolutions: TurnResolution[] = [];
  let finished = false;

  for (let i = 0; i < turns.length && !finished; i++) {
    const turn = turns[i]!;
    const resolution = resolveTurn(players, turn.actions, turn.validationOrders, i + 1);
    players = resolution.players;
    resolutions.push(resolution);
    finished = resolution.finished;
  }

  return { players, turns: resolutions, finished };
};
