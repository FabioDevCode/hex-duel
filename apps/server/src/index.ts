import { Server } from "colyseus";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { loadEnv } from "./config/env";
import { GameRoom } from "./rooms/GameRoom";
import { handleMatchmakingRequest } from "./services/MatchmakingRoutes";
import { handleStatsRequest } from "./services/StatsRoutes";
import { WebSocketTransport } from "@colyseus/ws-transport";

const env = loadEnv();

const httpServer = createServer();

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define("game", GameRoom);

const apiPort = env.apiPort;

const apiServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    if (await handleMatchmakingRequest(req, res)) return;
    if (await handleStatsRequest(req, res)) return;
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "NOT_FOUND" }));
  } catch (error: unknown) {
    console.error("API error", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "INTERNAL_ERROR" }));
    }
  }
});

apiServer.listen(apiPort, () => {
  console.log(`HEX DUEL matchmaking API listening on port ${apiPort}`);
});

gameServer.listen(env.port).then(() => {
  console.log(`HEX DUEL server listening on port ${env.port}`);
});
