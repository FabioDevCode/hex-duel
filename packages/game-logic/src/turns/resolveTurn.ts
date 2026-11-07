import { BASE_CONFIG, BONUS_CONFIG, GAME_CONFIG, isAttackAction } from "@hex-duel/shared";
import type {
  AttackType,
  BonusEvents,
  BonusType,
  GroundBonus,
  PlayerAction,
  PlayerState,
  Seat,
  Vector2,
} from "@hex-duel/shared";
import { buildArenaBounds, isInsideArena } from "../arena/positionValidation";
import { positionsOverlap } from "../collision/resolvePlayerCollision";
import { calculateDamage, type AttackOutcome } from "../combat/calculateDamage";
import { resolveMovement } from "../movement/resolveMovement";
import { computeBonusPosition, generateBonusSchedule, instantiateGroundBonus } from "../bonus/bonusPlanning";
import { pickupMethod } from "../bonus/pickups";
import { attackPriority } from "./attackPriority";
import { determineWinner } from "./determineWinner";

export type TurnReveal = { seat: Seat; action: PlayerAction };

/** Bonus state carried between turns by the server (D-191..D-199). */
export type BonusContext = {
  seed: number;
  ground: readonly GroundBonus[];
  armed: readonly [BonusType | null, BonusType | null];
};

/** Bonus state after the turn, for the server to persist and sync. */
export type BonusTurnResult = {
  ground: GroundBonus[];
  armed: [BonusType | null, BonusType | null];
  events: BonusEvents;
};

export type TurnResolution = {
  turnNumber: number;
  players: [PlayerState, PlayerState];
  attacks: AttackOutcome[];
  movementsCancelled: boolean;
  bonuses: BonusTurnResult | null;
  winner: { outcome: "WIN"; winnerSeat: Seat } | { outcome: "DRAW" } | null;
  finished: boolean;
};

export type ValidationOrder = Readonly<Record<Seat, number>>;

const defaultBounds = buildArenaBounds();
const insideArena = (position: Vector2): boolean => isInsideArena(position, defaultBounds);

const emptyEvents = (): BonusEvents => ({
  spawned: [],
  pickups: [],
  contested: [],
  expired: [],
  regen: [],
  shieldAbsorbed: [],
  consumed: [],
});

/**
 * Resolves one turn deterministically (§8.8):
 * 1. bonus spawn due this turn (position computed with the seed, D-197)
 * 2. movement resolution (simultaneous, D-031/D-033/D-035, boosted range
 *    if a MOVE bonus is armed)
 * 3. attack resolution (sequential by validation order, D-050..D-054,
 *    boosted params if an ATTACK bonus is armed, shield absorption)
 * 4. bonus pickups (position, trajectory, attack zone) and expiration
 * 5. victory check (GDD 8)
 *
 * Without a bonus context the behavior is strictly identical to before.
 */
export const resolveTurn = (
  players: readonly [PlayerState, PlayerState],
  actions: Readonly<Record<Seat, PlayerAction>>,
  validationOrders: ValidationOrder,
  turnNumber: number,
  bonus?: BonusContext,
): TurnResolution => {
  const actionTuple: [PlayerAction, PlayerAction] = [actions[0], actions[1]];

  // --- Bonus bookkeeping -------------------------------------------------
  const events = emptyEvents();
  const ground: GroundBonus[] = bonus ? [...bonus.ground] : [];
  const armed: [BonusType | null, BonusType | null] = bonus
    ? [bonus.armed[0], bonus.armed[1]]
    : [null, null];
  let workingPlayers: [PlayerState, PlayerState] = [players[0], players[1]];

  // Spawn due this turn (at most one by schedule design, capped on ground).
  if (bonus && ground.length < BONUS_CONFIG.maxOnGround) {
    const schedule = generateBonusSchedule(bonus.seed);
    const due = schedule.find((spawn) => spawn.turn === turnNumber);
    if (due) {
      const position = computeBonusPosition(
        bonus.seed,
        due.id,
        [players[0].position, players[1].position],
        insideArena,
      );
      const spawned = instantiateGroundBonus(due, position);
      ground.push(spawned);
      events.spawned.push(spawned);
    }
  }

  // --- Movement ----------------------------------------------------------
  const moveDistances: [number, number] | undefined = bonus
    ? [
        armed[0] === "MOVE" ? BONUS_CONFIG.boosted.moveDistance : GAME_CONFIG.maxMoveDistance,
        armed[1] === "MOVE" ? BONUS_CONFIG.boosted.moveDistance : GAME_CONFIG.maxMoveDistance,
      ]
    : undefined;

  const movement = resolveMovement(
    players,
    actionTuple,
    insideArena,
    positionsOverlap,
    moveDistances,
  );

  const movedPlayers: [PlayerState, PlayerState] = movement.moved
    ? movement.players
    : [players[0], players[1]];
  workingPlayers = movedPlayers;

  // A MOVE bonus is consumed by the movement it boosted (one move).
  if (bonus) {
    for (const seat of [0, 1] as const) {
      if (armed[seat] === "MOVE" && actionTuple[seat].type === "MOVE") {
        armed[seat] = null;
        events.consumed.push({ seat, type: "MOVE" });
      }
    }
  }

  // --- Attacks -----------------------------------------------------------
  const attacks: AttackOutcome[] = [];
  const attackParamsUsed: [AttackType | null, AttackType | null] = [null, null];
  const attackWasBoosted: [boolean, boolean] = [false, false];
  const bothAttack = isAttackAction(actionTuple[0]) && isAttackAction(actionTuple[1]);

  const applyAttack = (seat: Seat, currentPlayers: [PlayerState, PlayerState]): void => {
    const action = actionTuple[seat];
    if (!isAttackAction(action)) return;
    const attacker = currentPlayers[seat];
    const targetSeat: Seat = seat === 0 ? 1 : 0;
    const target = currentPlayers[targetSeat];
    if (!attacker.isAlive) return;

    const attackType = action.type as AttackType;
    const boosted = armed[seat] === "ATTACK";
    const attackParams = boosted
      ? BONUS_CONFIG.boosted.attacks[attackType]
      : baseAttackParams(attackType);
    attackParamsUsed[seat] = attackType;
    attackWasBoosted[seat] = boosted;

    const outcome = calculateDamage(attacker, target, attackType, action.direction, {
      attackParams,
      shielded: armed[targetSeat] === "SHIELD",
    });
    attacks.push(outcome);

    if (boosted) {
      armed[seat] = null;
      events.consumed.push({ seat, type: "ATTACK" });
    }
    if (outcome.absorbedByShield) {
      armed[targetSeat] = null;
      events.consumed.push({ seat: targetSeat, type: "SHIELD" });
      events.shieldAbsorbed.push({ seat: targetSeat });
    }
    currentPlayers[targetSeat] = {
      ...target,
      crystals: outcome.targetCrystalsAfter,
      isAlive: outcome.targetAlive,
    };
  };

  if (bothAttack) {
    const priority: [Seat, Seat] = attackPriority(validationOrders);
    const currentPlayers: [PlayerState, PlayerState] = [movedPlayers[0], movedPlayers[1]];

    for (const seat of priority) {
      applyAttack(seat, currentPlayers);
      if (!currentPlayers[seat === 0 ? 1 : 0].isAlive) break;
    }

    workingPlayers = currentPlayers;
    return finish(
      workingPlayers,
      turnNumber,
      attacks,
      !movement.moved,
      bonus,
      ground,
      armed,
      events,
      actionTuple,
      attackParamsUsed,
      movement.moved,
      [players[0].position, players[1].position],
      attackWasBoosted,
    );
  }

  const currentPlayers: [PlayerState, PlayerState] = [movedPlayers[0], movedPlayers[1]];
  for (const seat of [0, 1] as const) {
    applyAttack(seat, currentPlayers);
  }
  workingPlayers = currentPlayers;

  return finish(
    workingPlayers,
    turnNumber,
    attacks,
    !movement.moved,
    bonus,
    ground,
    armed,
    events,
    actionTuple,
    attackParamsUsed,
    movement.moved,
    [players[0].position, players[1].position],
    attackWasBoosted,
  );
};

const baseAttackParams = (attackType: AttackType): { range: number; angle: number } => {
  const base = BASE_CONFIG.attacks[attackType];
  return { range: base.range, angle: base.angle };
};

const finish = (
  players: [PlayerState, PlayerState],
  turnNumber: number,
  attacks: AttackOutcome[],
  movementsCancelled: boolean,
  bonus: BonusContext | undefined,
  groundIn: GroundBonus[],
  armed: [BonusType | null, BonusType | null],
  events: BonusEvents,
  actions: readonly [PlayerAction, PlayerAction],
  attackParamsUsed: readonly [AttackType | null, AttackType | null],
  moved: boolean,
  startPositions: readonly [Vector2, Vector2],
  attackWasBoosted: readonly [boolean, boolean],
): TurnResolution => {
  let ground = groundIn;

  if (bonus) {
    // --- Pickups (D-195/D-196) -------------------------------------------
    const pickedIds = new Set<string>();
    const slotTaken: [boolean, boolean] = [false, false];

    for (const bonusItem of ground) {
      if (pickedIds.has(bonusItem.id)) continue;
      const pickers: { seat: Seat; method: "POSITION" | "TRAJECTORY" | "ATTACK" }[] = [];
      for (const seat of [0, 1] as const) {
        const player = players[seat];
        if (!player.isAlive) continue;
        // A crystal (REGEN) does nothing at full crystals: it is not
        // picked up and stays on the ground.
        if (bonusItem.type === "REGEN" && player.crystals >= GAME_CONFIG.maxCrystals) continue;
        const action = actions[seat];
        const attackType = attackParamsUsed[seat];
        const params =
          attackType !== null
            ? {
                type: attackType,
                range: attackWasBoosted[seat]
                  ? BONUS_CONFIG.boosted.attacks[attackType].range
                  : baseAttackParams(attackType).range,
                angle: attackWasBoosted[seat]
                  ? BONUS_CONFIG.boosted.attacks[attackType].angle
                  : baseAttackParams(attackType).angle,
              }
            : null;
        const method = pickupMethod(
          bonusItem,
          startPositions[seat],
          player.position,
          moved && action.type === "MOVE",
          action,
          params,
        );
        if (method) pickers.push({ seat, method });
      }

      if (pickers.length === 2) {
        // Both players picked the same bonus: nobody gets it (D-196).
        events.contested.push(bonusItem.id);
        continue;
      }
      if (pickers.length === 0) continue;

      const { seat, method } = pickers[0]!;
      if (bonusItem.type === "REGEN") {
        // Immediate effect, no slot (D-193), capped at max crystals.
        const crystals = Math.min(GAME_CONFIG.maxCrystals, players[seat].crystals + 1);
        players[seat] = { ...players[seat], crystals, isAlive: crystals > 0 ? players[seat].isAlive : false };
        events.regen.push({ seat, crystalsAfter: crystals });
        events.pickups.push({ seat, bonus: bonusItem, method });
        pickedIds.add(bonusItem.id);
        continue;
      }
      if (slotTaken[seat]) continue;
      // Single armed slot: the new bonus replaces the previous one (D-194).
      armed[seat] = bonusItem.type;
      slotTaken[seat] = true;
      events.pickups.push({ seat, bonus: bonusItem, method });
      pickedIds.add(bonusItem.id);
    }

    ground = ground.filter((item) => !pickedIds.has(item.id));

    // --- Expiration (D-198): the spawn turn + the next turn, then gone ---
    const survivors: GroundBonus[] = [];
    for (const item of ground) {
      if (turnNumber >= item.spawnTurn + BONUS_CONFIG.groundLifetimeTurns + 1) {
        events.expired.push(item.id);
      } else {
        survivors.push(item);
      }
    }
    ground = survivors;
  }

  const { finished, result } = determineWinner(players, turnNumber);
  return {
    turnNumber,
    players,
    attacks,
    movementsCancelled,
    bonuses: bonus ? { ground, armed, events } : null,
    winner: result,
    finished,
  };
};
