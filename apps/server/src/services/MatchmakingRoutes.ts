import type { IncomingMessage, ServerResponse } from "node:http";
import { matchMaker } from "@colyseus/core";
import { generateInvitationCode } from "../matchmaking/PrivateRoomService";

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk: Buffer) => {
      data += chunk.toString();
    });
    req.on("end", () => resolve(data));
  });

const send = (res: ServerResponse, status: number, body: unknown): void => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

/**
 * Minimal HTTP matchmaking API used by the web client:
 *   POST /quick-match         -> { roomId }
 *   POST /private-room        -> { roomId, code }
 *   PUT  /private-room (code) -> { roomId } | 404 | 409
 */
export const handleMatchmakingRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> => {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  if (url === "/api/quick-match" && method === "POST") {
    const available = await matchMaker.findOneRoomAvailable("game", {});
    if (available && !available.private && available.clients < 2) {
      send(res, 200, { roomId: available.roomId });
      return true;
    }
    const created = await matchMaker.createRoom("game", {});
    send(res, 200, { roomId: created.roomId });
    return true;
  }

  if (url === "/api/cancel-matchmaking" && method === "POST") {
    const body = JSON.parse(await readBody(req)) as { roomId?: string };
    const roomId = body.roomId ?? "";
    if (roomId) {
      try {
        await matchMaker.remoteRoomCall(roomId, "dispose" as never);
      } catch {
        // Room already gone: nothing to cancel.
      }
    }
    send(res, 200, { cancelled: true });
    return true;
  }

  if (url === "/api/private-room" && method === "POST") {
    const code = generateInvitationCode();
    const created = await matchMaker.createRoom("game", { private: true, code });
    send(res, 200, { roomId: created.roomId, code });
    return true;
  }

  if (url === "/api/private-room" && method === "PUT") {
    const body = JSON.parse(await readBody(req)) as { code?: string };
    const code = (body.code ?? "").trim().toUpperCase();
    if (code.length < 4) {
      send(res, 400, { error: "INVALID_CODE" });
      return true;
    }
    const rooms = await matchMaker.query({ name: "game" });
    const room = rooms.find(
      (r) => r.private && (r.metadata as { code?: string } | undefined)?.code === code,
    );
    if (!room) {
      send(res, 404, { error: "ROOM_NOT_FOUND" });
      return true;
    }
    if (room.clients >= 2) {
      send(res, 409, { error: "ROOM_FULL" });
      return true;
    }
    send(res, 200, { roomId: room.roomId });
    return true;
  }

  return false;
};
