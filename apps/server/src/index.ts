import { Server } from "colyseus";
import { createServer } from "node:http";
import { loadEnv } from "./config/env";
import { GameRoom } from "./rooms/GameRoom";
import { WebSocketTransport } from "@colyseus/ws-transport";

const env = loadEnv();

const httpServer = createServer((req, res) => {
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
