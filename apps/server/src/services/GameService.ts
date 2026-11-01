import { GAME_CONFIG, isAttackAction } from "@hex-duel/shared";
import type { PlayerAction, PlayerState, Seat } from "@hex-duel/shared";
import { resolveTurn } from "@hex-duel/game-logic";
import type { TurnResolution, ValidationOrder } from "@hex-duel/game-logic";

export type SubmitResult =
  | { ok: true; order: number }
  | { ok: false; code: string; message: string };

/**
 * Server-authoritative game orchestration for a single room.
 * Secret actions are kept here, never in the synced Colyseus state (D-134).
 */
export class GameService {
  private readonly players: [PlayerState, PlayerState];
  private readonly submitted = new Map<Seat, { action: PlayerAction; order: number }>();
  private orderCounter = 0;

  constructor(playerIds: Readonly<Record<Seat, string>>) {
    this.players = [
      {
        id: playerIds[0],
        seat: 0,
        position: { x: -6, z: 0 },
        orientation: 0,
        hp: GAME_CONFIG.maxHp,
        isAlive: true,
      },
      {
        id: playerIds[1],
        seat: 1,
        position: { x: 6, z: 0 },
        orientation: 180,
        hp: GAME_CONFIG.maxHp,
        isAlive: true,
      },
    ];
  }

  getPlayers(): readonly [PlayerState, PlayerState] {
    return this.players;
  }

  hasValidated(seat: Seat): boolean {
    return this.submitted.has(seat);
  }

  bothValidated(): boolean {
    return this.submitted.size === 2;
  }

  submit(seat: Seat, action: PlayerAction): SubmitResult {
    if (this.submitted.has(seat)) {
      return {
        ok: false,
        code: "ACTION_ALREADY_SUBMITTED",
        message: "An action has already been submitted for this turn.",
      };
    }
    if (isAttackAction(action) && !Number.isFinite(action.direction)) {
      return { ok: false, code: "INVALID_ACTION", message: "Invalid attack direction." };
    }
    if (action.type === "MOVE" && (!Number.isFinite(action.target.x) || !Number.isFinite(action.target.z))) {
      return { ok: false, code: "INVALID_ACTION", message: "Invalid move target." };
    }
    const order = ++this.orderCounter;
    this.submitted.set(seat, { action, order });
    return { ok: true, order };
  }

  /**
   * Snapshot of the submitted actions for the reveal phase (MULTIPLAYER_SPEC 8.6).
   * Missing submissions read as PASS, matching the resolution semantics.
   */  getRevealedActions(): { seat: Seat; action: PlayerAction; order: number }[] {
    const entries: { seat: Seat; action: PlayerAction; order: number }[] = [];
    for (const seat of [0, 1] as const) {
      entries.push({
        seat,
        action: this.submitted.get(seat)?.action ?? { type: "PASS" },
        order: this.submitted.get(seat)?.order ?? 0,
      });
    }
    return entries;
  }

  /** Applies PASS to players who did not validate before the deadline (D-024). */
  resolveCurrentTurn(turnNumber: number): TurnResolution {
    const actions: Record<Seat, PlayerAction> = {
      0: this.submitted.get(0)?.action ?? { type: "PASS" },
      1: this.submitted.get(1)?.action ?? { type: "PASS" },
    };
    const orders: ValidationOrder = {
      0: this.submitted.get(0)?.order ?? 0,
      1: this.submitted.get(1)?.order ?? 0,
    };
    const resolution = resolveTurn(this.players, actions, orders, turnNumber);
    this.players[0] = resolution.players[0];
    this.players[1] = resolution.players[1];
    this.submitted.clear();
    this.orderCounter = 0;
    return resolution;
  }
}
