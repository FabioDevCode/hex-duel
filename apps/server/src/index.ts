import { Server } from "colyseus";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { loadEnv } from "./config/env";
import { GameRoom } from "./rooms/GameRoom";
import { handleMatchmakingRequest } from "./services/MatchmakingRoutes";
import { handleStatsRequest } from "./services/StatsRoutes";
import { WebSocketTransport } from "@colyseus/ws-transport";

const env = loadEnv();

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (await handleMatchmakingRequest(req, res)) return;
  if (await handleStatsRequest(req, res)) return;
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("HEX DUEL server");
});

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define("game", GameRoom);

gameServer.listen(env.port).then(() => {
  console.log(`HEX DUEL server listening on port ${env.port}`);
});
