import { isAttackAction } from "@hex-duel/shared";
import type { AttackType, PlayerAction, PlayerState, Seat, Vector2 } from "@hex-duel/shared";
import { buildArenaBounds, isInsideArena } from "../arena/positionValidation";
import { positionsOverlap } from "../collision/resolvePlayerCollision";
import { calculateDamage, type AttackOutcome } from "../combat/calculateDamage";
import { resolveMovement } from "../movement/resolveMovement";
import { attackPriority } from "./attackPriority";
import { determineWinner } from "./determineWinner";

export type TurnReveal = { seat: Seat; action: PlayerAction };

export type TurnResolution = {
  turnNumber: number;
  players: [PlayerState, PlayerState];
  attacks: AttackOutcome[];
  movementsCancelled: boolean;
  winner: { outcome: "WIN"; winnerSeat: Seat } | { outcome: "DRAW" } | null;
  finished: boolean;
};

export type ValidationOrder = Readonly<Record<Seat, number>>;

const defaultBounds = buildArenaBounds();
const insideArena = (position: Vector2): boolean => isInsideArena(position, defaultBounds);

/**
 * Resolves one turn deterministically (§8.8):
 * 1. movement resolution (simultaneous, D-031/D-033/D-035)
 * 2. attack resolution (sequential by validation order, D-050..D-054)
 * 3. HP update and victory check (GDD 8)
 */
export const resolveTurn = (
  players: readonly [PlayerState, PlayerState],
  actions: Readonly<Record<Seat, PlayerAction>>,
  validationOrders: ValidationOrder,
  turnNumber: number,
): TurnResolution => {
  const actionTuple: [PlayerAction, PlayerAction] = [actions[0], actions[1]];

  const movement = resolveMovement(
    players,
    actionTuple,
    insideArena,
    positionsOverlap,
  );

  const movedPlayers: [PlayerState, PlayerState] = movement.moved
    ? movement.players
    : [players[0], players[1]];

  const attacks: AttackOutcome[] = [];
  const bothAttack = isAttackAction(actionTuple[0]) && isAttackAction(actionTuple[1]);

  if (bothAttack) {
    const priority: [Seat, Seat] = attackPriority(validationOrders);
    const currentPlayers: [PlayerState, PlayerState] = [movedPlayers[0], movedPlayers[1]];

    for (const seat of priority) {
      const attacker = currentPlayers[seat];
      const targetSeat: Seat = seat === 0 ? 1 : 0;
      const target = currentPlayers[targetSeat];
      const action = actionTuple[seat];
      if (!isAttackAction(action) || !attacker.isAlive) continue;

      const outcome = calculateDamage(attacker, target, action.type as AttackType, action.direction);
      attacks.push(outcome);
      currentPlayers[targetSeat] = { ...target, hp: outcome.targetHpAfter, isAlive: outcome.targetAlive };

      if (!outcome.targetAlive) break;
    }

    return finish(currentPlayers, turnNumber, attacks, !movement.moved);
  }

  for (const seat of [0, 1] as const) {
    const action = actionTuple[seat];
    const attacker = movedPlayers[seat];
    if (!isAttackAction(action) || !attacker.isAlive) continue;
    const targetSeat: Seat = seat === 0 ? 1 : 0;
    const target = movedPlayers[targetSeat];
    const outcome = calculateDamage(attacker, target, action.type as AttackType, action.direction);
    attacks.push(outcome);
    movedPlayers[targetSeat] = { ...target, hp: outcome.targetHpAfter, isAlive: outcome.targetAlive };
  }

  return finish(movedPlayers, turnNumber, attacks, !movement.moved);
};

const finish = (
  players: [PlayerState, PlayerState],
  turnNumber: number,
  attacks: AttackOutcome[],
  movementsCancelled: boolean,
): TurnResolution => {
  const { finished, result } = determineWinner(players, turnNumber);
  return {
    turnNumber,
    players,
    attacks,
    movementsCancelled,
    winner: result,
    finished,
  };
};
