import { useState } from "nuxt/app";
import { useGameRoom } from "~/composables/useGameRoom";

export const useMatchmaking = () => {
  const { joinById, leaveRoom, room } = useGameRoom();
  const isSearching = useState("mm-searching", () => false);

  const startQuickMatch = async (): Promise<void> => {
    isSearching.value = true;
    try {
      const config = useRuntimeConfig();
      const response = await fetch(`${config.public.matchmakingUrl}/api/quick-match`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("MATCHMAKING_FAILED");
      const data: { roomId: string } = (await response.json()) as { roomId: string };
      await joinById(data.roomId);
      await navigateTo(`/game/${data.roomId}`);
    } finally {
      isSearching.value = false;
    }
  };

  const cancel = async (): Promise<void> => {
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
