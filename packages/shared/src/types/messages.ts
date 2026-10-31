import type { PlayerAction } from "./actions";
import type { GameResult, GameStatus, PlayerState } from "./game";
import type { Seat, Vector2 } from "./geometry";

export type SubmitActionMessage = {
  type: "submit_action";
  actionId: string;
  action: PlayerAction;
};

export type CancelMatchmakingMessage = {
  type: "cancel_matchmaking";
};

export type RequestRoomInfoMessage = {
  type: "request_room_info";
};

export type PingMessage = {
  type: "ping";
};

export type ClientMessage =
  | SubmitActionMessage
  | CancelMatchmakingMessage
  | RequestRoomInfoMessage
  | PingMessage;

export type RoomReadyMessage = {
  type: "room_ready";
  yourSeat: Seat;
};

export type TurnStartedMessage = {
  type: "turn_started";
  turnNumber: number;
  deadlineAt: number;
};

export type ActionAcceptedMessage = {
  type: "action_accepted";
  actionId: string;
};

export type PlayerReadyMessage = {
  type: "player_ready";
  seats: Seat[];
};

export type TurnRevealedMessage = {
  type: "turn_revealed";
  turnNumber: number;
  actions: { seat: Seat; action: PlayerAction }[];
};

export type TurnResolvedMessage = {
  type: "turn_resolved";
  turnNumber: number;
  players: [PlayerState, PlayerState];
};

export type GameFinishedMessage = {
  type: "game_finished";
  result: GameResult;
};

export type PlayerDisconnectedMessage = {
  type: "player_disconnected";
  seat: Seat;
};

export type PlayerReconnectedMessage = {
  type: "player_reconnected";
  seat: Seat;
};

export type ServerErrorMessage = {
  type: "server_error";
  code: string;
  message: string;
};

export type ServerMessage =
  | RoomReadyMessage
  | TurnStartedMessage
  | ActionAcceptedMessage
  | PlayerReadyMessage
  | TurnRevealedMessage
  | TurnResolvedMessage
  | GameFinishedMessage
  | PlayerDisconnectedMessage
  | PlayerReconnectedMessage
  | ServerErrorMessage;

export type RoomInfo = {
  roomId: string;
  status: GameStatus;
  joinedSeats: Seat[];
  maxPlayers: 2;
};

export type Spawn = {
  seat: Seat;
  position: Vector2;
};
