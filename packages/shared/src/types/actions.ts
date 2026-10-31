import type { Vector2 } from "./geometry";

export type AttackType = "SWEEP" | "STRIKE" | "SNIPER";

export type MoveAction = {
  type: "MOVE";
  target: Vector2;
};

export type AttackAction = {
  type: AttackType;
  direction: number;
};

export type PassAction = {
  type: "PASS";
};

export type PlayerAction = MoveAction | AttackAction | PassAction;

export const isAttackAction = (action: PlayerAction): action is AttackAction =>
  action.type === "SWEEP" || action.type === "STRIKE" || action.type === "SNIPER";

export const isMoveAction = (action: PlayerAction): action is MoveAction =>
  action.type === "MOVE";
