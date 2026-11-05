import { Client, type Room } from "@colyseus/sdk";
import type { Seat } from "@hex-duel/shared";
import { useState } from "nuxt/app";

export type SyncedGameRoom = Room<unknown> & {
  // Undefined until the first state patch from the server arrives.
  state?:
    | {
        status: string;
        turnNumber: number;
        turnDeadlineAt: number;
        players: {
          seat: number;
          id: string;
          pseudonym?: string;
          x: number;
          z: number;
          crystals: number;
          isAlive: boolean;
          connected: boolean;
          hasValidated: boolean;
        }[];
      }
    | undefined;
};

export type PublicGameState = {
  status: string;
  turnNumber: number;
  turnDeadlineAt: number;
  players: {
    seat: Seat;
    pseudonym: string;
    x: number;
    z: number;
    crystals: number;
    isAlive: boolean;
    hasValidated: boolean;
  }[];
};

const toPublicState = (room: SyncedGameRoom): PublicGameState | null => {
  const state = room.state;
  // Right after joinById the state schema is still empty: it only becomes
  // usable when the first patch arrives (players becomes defined).
  if (!state || !state.players) return null;
  return {
    status: state.status,
    turnNumber: state.turnNumber,
    turnDeadlineAt: state.turnDeadlineAt,
    players: state.players.map((p) => ({
      seat: (p.seat === 0 ? 0 : 1) as Seat,
      pseudonym: p.pseudonym ?? "",
      x: p.x,
      z: p.z,
      crystals: p.crystals,
      isAlive: p.isAlive,
      hasValidated: p.hasValidated,
    })),
  };
};

// Handlers are bound once per room instance; navigating between pages that
// both call joinById for the same room must not register them twice.
const boundRooms = new WeakSet<SyncedGameRoom>();

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
      // The room may already be joined (Quick Match joins before navigating
      // to /game/:roomId): reusing it avoids consuming a second seat.
      const existing = room.value;
      if (existing && existing.roomId === roomId) {
        bindRoom(existing);
        return;
      }
      // The pseudonym travels with the join options: the server always
      // re-validates it (D-083); it is display data, never an identity.
      const { pseudonym } = usePseudonym();
      const joined = (await getClient().joinById(roomId, { pseudo: pseudonym.value })) as SyncedGameRoom;
      room.value = joined;
      bindRoom(joined);
    } catch (error: unknown) {
      console.error("Failed to join room", roomId, error);
      lastError.value = "ROOM_UNAVAILABLE";
      throw new Error("ROOM_UNAVAILABLE");
    }
  };

  const bindRoom = (joined: SyncedGameRoom): void => {
    if (boundRooms.has(joined)) return;
    boundRooms.add(joined);
    // With SDK 0.18 the state is not synchronized yet when joinById
    // resolves: the first onStateChange (or an already synced state)
    // provides it.
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

  const surrender = (): void => {
    room.value?.send("surrender", {});
  };

  const leaveRoom = (): void => {
    room.value?.leave(true);
    room.value = null;
    gameState.value = null;
    mySeat.value = null;
  };

  return { joinById, submitAction, surrender, leaveRoom, gameState, mySeat, lastError, room };
};
