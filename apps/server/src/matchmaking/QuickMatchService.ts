import { matchMaker } from "@colyseus/core";

/**
 * Quick Match: find a public room with one open seat, or create one (D-070).
 * Private rooms are excluded (D-073).
 */
export const findQuickMatch = async (): Promise<string> => {
  const rooms = await matchMaker.query({ name: "game" });
  const waiting = rooms.find((room) => !room.private && room.clients < 2);
  if (waiting) return waiting.roomId;
  const created = await matchMaker.createRoom("game", {});
  return created.roomId;
};
