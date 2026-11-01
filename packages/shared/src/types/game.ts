import type { Orientation, PlayerId, Seat, Vector2 } from "./geometry";

export type PlayerState = {
  id: PlayerId;
  seat: Seat;
  position: Vector2;
  orientation: Orientation;
  crystals: number;
  isAlive: boolean;
};

export type GameStatus =
  | "WAITING"
  | "READY"
  | "SELECTING"
  | "RESOLVING"
  | "FINISHED"
  | "CANCELLED";

export type GameState = {
  turnNumber: number;
  status: GameStatus;
  players: [PlayerState, PlayerState];
};

export type GameResult =
  | { outcome: "WIN"; winnerSeat: Seat }
  | { outcome: "DRAW" }
  | { outcome: "CANCELLED" };
