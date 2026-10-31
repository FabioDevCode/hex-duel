import { matchMaker } from "@colyseus/core";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

/** Server-generated invitation code (D-074), unambiguous characters only. */
export const generateInvitationCode = (): string => {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)] ?? "";
  }
  return code;
};

export const createPrivateRoom = async (): Promise<{ roomId: string; code: string }> => {
  const created = await matchMaker.createRoom("game", { private: true });
  return { roomId: created.roomId, code: generateInvitationCode() };
};

export const findPrivateRoomByCode = async (code: string): Promise<string | null> => {
  const rooms = await matchMaker.query({ name: "game" });
  const room = rooms.find(
    (r) => r.private && r.metadata?.code === code.toUpperCase() && r.clients < 2,
  );
  return room ? room.roomId : null;
};
