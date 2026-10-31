import type { IncomingMessage, ServerResponse } from "node:http";
import { getPlayerStats } from "./ResultService";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const send = (res: ServerResponse, status: number, body: unknown): void => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

/**
 * GET /profile/:playerId -> player statistics (UI_UX_SPEC 20).
 * Returns null stats when persistence is not configured.
 */
export const handleStatsRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> => {
  const url = req.url ?? "";
  const method = req.method ?? "GET";
  if (method !== "GET") return false;

  const match = /^\/profile\/([0-9a-f-]+)$/.exec(url);
  if (!match) return false;
  const playerId = match[1] ?? "";
  if (!UUID_RE.test(playerId)) {
    send(res, 400, { error: "INVALID_PLAYER_ID" });
    return true;
  }

  const stats = await getPlayerStats(playerId);
  if (!stats) {
    send(res, 200, { matchesPlayed: 0, wins: 0, losses: 0, draws: 0 });
    return true;
  }
  send(res, 200, stats);
  return true;
};
