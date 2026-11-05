import { useState } from "nuxt/app";
import { useGameRoom } from "~/composables/useGameRoom";

export const useMatchmaking = () => {
  const { joinById, leaveRoom, room, gameState } = useGameRoom();
  const isSearching = useState("mm-searching", () => false);
  // Room joined while waiting for an opponent: the match only starts when
  // a second player joins it, so we stay on /matchmaking until then.
  const pendingRoomId = useState<string | null>("mm-pending-room", () => null);

  // As soon as the waiting room fills up (2 players), the match is found:
  // stop searching and navigate to the game. Stopping "searching" before
  // navigating matters: the page unmounts during navigateTo, and the
  // unmount hook must not treat the joined room as an abandoned search.
  watch(
    gameState,
    (state) => {
      if (!pendingRoomId.value || !state) return;
      if (state.players.length >= 2) {
        const roomId = pendingRoomId.value;
        pendingRoomId.value = null;
        isSearching.value = false;
        void navigateTo(`/game/${roomId}`);
      }
    },
    { deep: true },
  );

  const startQuickMatch = async (): Promise<void> => {
    isSearching.value = true;
    try {
      const config = useRuntimeConfig();
      const response = await fetch(`${config.public.matchmakingUrl}/api/quick-match`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("MATCHMAKING_FAILED");
      const data: { roomId: string } = (await response.json()) as { roomId: string };
      // Join the (possibly empty) room but keep showing the search screen
      // until an opponent also joins it.
      await joinById(data.roomId);
      pendingRoomId.value = data.roomId;
    } catch (error: unknown) {
      isSearching.value = false;
      pendingRoomId.value = null;
      throw error;
    }
  };

  const cancel = async (): Promise<void> => {
    pendingRoomId.value = null;
    if (room.value) {
      const roomId: string = room.value.roomId;
      leaveRoom();
      const config = useRuntimeConfig();
      try {
        await fetch(`${config.public.matchmakingUrl}/api/cancel-matchmaking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        });
      } catch {
        // Server unreachable: the empty room expires on its own.
      }
    }
    isSearching.value = false;
  };

  return { startQuickMatch, cancel, isSearching };
};
