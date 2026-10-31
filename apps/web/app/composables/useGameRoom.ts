import { Client, type Room } from "colyseus.js";
import type { Seat } from "@hex-duel/shared";
import { useState } from "nuxt/app";

export type SyncedGameRoom = Room<unknown> & {
  state: {
    status: string;
    turnNumber: number;
    turnDeadlineAt: number;
    players: {
      seat: number;
      id: string;
      x: number;
      z: number;
      hp: number;
      isAlive: boolean;
      connected: boolean;
      hasValidated: boolean;
    }[];
  };
};

export type PublicGameState = {
  status: string;
  turnNumber: number;
  turnDeadlineAt: number;
  players: { seat: Seat; x: number; z: number; hp: number; isAlive: boolean; hasValidated: boolean }[];
};

const toPublicState = (room: SyncedGameRoom): PublicGameState => ({
  status: room.state.status,
  turnNumber: room.state.turnNumber,
  turnDeadlineAt: room.state.turnDeadlineAt,
  players: room.state.players.map((p) => ({
    seat: (p.seat === 0 ? 0 : 1) as Seat,
    x: p.x,
    z: p.z,
    hp: p.hp,
    isAlive: p.isAlive,
    hasValidated: p.hasValidated,
  })),
});

export const useGameRoom = () => {
  const client = useState<Client | null>("game-client", () => null);
  const room = useState<SyncedGameRoom | null>("game-room", () => null);
  const mySeat = useState<Seat | null>("my-seat", () => null);
  const gameState = useState<PublicGameState | null>("game-state", () => null);
  const lastError = useState<string | null>("game-error", () => null);

  const getClient = (): Client => {
    if (!client.value) {
      const config = useRuntimeConfig();
      client.value = new Client(config.public.serverUrl);
    }
    return client.value;
  };

  const joinById = async (roomId: string): Promise<void> => {
    try {
      room.value = (await getClient().joinById(roomId)) as SyncedGameRoom;
      bindRoom(room.value);
    } catch {
      lastError.value = "ROOM_UNAVAILABLE";
      throw new Error("ROOM_UNAVAILABLE");
    }
  };

  const bindRoom = (joined: SyncedGameRoom): void => {
    gameState.value = toPublicState(joined);
    joined.onStateChange(() => {
      gameState.value = toPublicState(joined);
    });
    joined.onMessage(
      "room_ready",
      (message: { yourSeat: Seat; playerId?: string }) => {
        mySeat.value = message.yourSeat;
        if (message.playerId) {
          localStorage.setItem("hex-duel-player-id", message.playerId);
        }
      },
    );
    joined.onError(() => {
      lastError.value = "ROOM_ERROR";
    });
    joined.onLeave(() => {
      lastError.value = "DISCONNECTED";
    });
  };

  const submitAction = (action: unknown, actionId: string): void => {
    room.value?.send("submit_action", { type: "submit_action", actionId, action });
  };

  const leaveRoom = (): void => {
    room.value?.leave(true);
    room.value = null;
    gameState.value = null;
    mySeat.value = null;
  };

  return { joinById, submitAction, leaveRoom, gameState, mySeat, lastError, room };
};
