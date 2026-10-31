import { ClientMessageSchema, GAME_CONFIG } from "@hex-duel/shared";
import type { PlayerAction, Seat } from "@hex-duel/shared";
import { Room, type Client } from "colyseus";
import { GameService } from "../services/GameService";
import { recordMatchResult } from "../services/ResultService";
import { createGuestPlayer } from "../services/PlayerService";
import { GameRoomState, PlayerSchema } from "./GameRoomState";

const RECONNECTION_SECONDS = Math.ceil(GAME_CONFIG.reconnectGracePeriodMs / 1000);

export class GameRoom extends Room<{ state: GameRoomState }> {
  override maxClients = 2;
  private game = new GameService({ 0: "", 1: "" });
  private turnTimer: ReturnType<typeof setTimeout> | null = null;
  private seatBySessionId = new Map<string, Seat>();
  private playerIds: [string, string] = ["", ""];
  private startedAtMs = Date.now();
  private resultRecorded = false;

  override onCreate(options?: { private?: boolean; code?: string }): void {
    this.setState(new GameRoomState());
    if (options?.private) {
      this.setPrivate(true);
      this.metadata = { code: options.code ?? null };
    }

    this.onMessage("submit_action", (client, message: unknown) => {
      const parsed = ClientMessageSchema.safeParse(message);
      if (!parsed.success || parsed.data.type !== "submit_action") {
        this.send(client, "server_error", {
          code: "INVALID_MESSAGE",
          message: "Malformed message.",
        });
        return;
      }
      this.handleSubmit(client, parsed.data.action);
    });

    this.onMessage("ping", (client) => {
      this.send(client, "pong", {});
    });
  }

  override async onJoin(client: Client, options?: { sessionId?: string }): Promise<void> {
    const seat: Seat = this.state.players.length === 0 ? 0 : 1;
    const guestPlayer = await createGuestPlayer();
    this.playerIds[seat] = guestPlayer.id;

    const player = new PlayerSchema();
    player.seat = seat;
    player.id = client.sessionId;
    player.x = seat === 0 ? -6 : 6;
    player.z = 0;
    player.hp = GAME_CONFIG.maxHp;
    this.state.players.push(player);

    const claimedSession =
      typeof options?.sessionId === "string" ? options.sessionId : client.sessionId;
    this.seatBySessionId.set(claimedSession, seat);

    this.send(client, "room_ready", { yourSeat: seat, playerId: guestPlayer.id, displayName: guestPlayer.displayName });

    if (this.state.players.length === 2) {
      this.state.status = "SELECTING";
      this.startTurn();
    }
  }

  override onLeave(client: Client, code?: number): void {
    const player = this.state.players.find((p: PlayerSchema) => p.id === client.sessionId);
    if (player) player.connected = false;

    if (this.state.status === "FINISHED") return;

    // code 1001 (going away) is the normal close; anything else is treated
    // as an unexpected drop eligible for the reconnection grace period.
    const consented = code === 1001;

    if (!consented) {
      this.allowReconnection(client, RECONNECTION_SECONDS)
        .then(() => {
          if (player) player.connected = true;
          this.broadcast("player_reconnected", { seat: player?.seat ?? 0 });
        })
        .catch(() => {
          this.handleAbandon(player?.seat === 0 ? 1 : 0);
        });
      return;
    }

    this.handleAbandon(player?.seat === 0 ? 1 : 0);
  }

  override onDispose(): void {
    this.clearTurnTimer();
  }

  private handleSubmit(client: Client, action: PlayerAction): void {
    const seat = this.seatBySessionId.get(client.sessionId) ?? null;
    if (seat === null) {
      this.send(client, "server_error", {
        code: "NOT_IN_ROOM",
        message: "Player not found in this room.",
      });
      return;
    }
    if (this.state.status !== "SELECTING") {
      this.send(client, "server_error", {
        code: "NOT_SELECTING",
        message: "Actions can only be submitted during selection.",
      });
      return;
    }
    const result = this.game.submit(seat, action);
    if (!result.ok) {
      this.send(client, "server_error", { code: result.code, message: result.message });
      return;
    }
    const playerState = this.state.players.at(seat);
    if (playerState) playerState.hasValidated = true;
    this.send(client, "action_accepted", {});
    this.broadcast("player_ready", { seats: [seat] });
    if (this.game.bothValidated()) {
      this.resolveTurn();
    }
  }

  private startTurn(): void {
    this.state.turnNumber += 1;
    this.state.status = "SELECTING";
    this.state.turnDeadlineAt = Date.now() + GAME_CONFIG.turnDurationMs;
    for (const p of this.state.players) p.hasValidated = false;
    this.broadcast("turn_started", {
      turnNumber: this.state.turnNumber,
      deadlineAt: this.state.turnDeadlineAt,
    });
    this.clearTurnTimer();
    this.turnTimer = setTimeout(() => this.resolveTurn(), GAME_CONFIG.turnDurationMs);
  }

  private resolveTurn(): void {
    if (this.state.status !== "SELECTING") return;
    this.clearTurnTimer();
    this.state.status = "RESOLVING";

    const resolution = this.game.resolveCurrentTurn(this.state.turnNumber);
    for (let i = 0; i < 2; i++) {
      const synced = this.state.players.at(i);
      const resolved = resolution.players[i];
      if (synced && resolved) {
        synced.x = resolved.position.x;
        synced.z = resolved.position.z;
        synced.hp = resolved.hp;
        synced.isAlive = resolved.isAlive;
      }
    }

    this.broadcast("turn_resolved", {
      turnNumber: resolution.turnNumber,
      players: resolution.players,
    });

    if (resolution.finished && resolution.winner) {
      this.state.status = "FINISHED";
      this.broadcast("game_finished", { result: resolution.winner });
      void this.recordResult(resolution.winner, resolution.turnNumber, "COMPLETED");
      return;
    }
    this.startTurn();
  }

  private handleAbandon(winnerSeat: Seat): void {
    this.clearTurnTimer();
    this.state.status = "FINISHED";
    this.broadcast("game_finished", { result: { outcome: "WIN", winnerSeat } });
    void this.recordResult({ outcome: "WIN", winnerSeat }, this.state.turnNumber, "ABANDON");
  }

  private async recordResult(
    winner: { outcome: "WIN"; winnerSeat: Seat } | { outcome: "DRAW" },
    turnCount: number,
    finishReason: string,
  ): Promise<void> {
    if (this.resultRecorded) return;
    this.resultRecorded = true;
    const [idOne, idTwo] = this.playerIds;
    if (!idOne || !idTwo) return;
    const players = this.game.getPlayers();
    await recordMatchResult({
      roomId: this.roomId,
      playerOneId: idOne,
      playerTwoId: idTwo,
      outcome:
        winner.outcome === "WIN"
          ? { outcome: "WIN", winnerPlayerId: this.playerIds[winner.winnerSeat] }
          : { outcome: "DRAW" },
      turnCount,
      finishReason,
      startedAtMs: this.startedAtMs,
      playerOneHp: players[0].hp,
      playerTwoHp: players[1].hp,
    }).catch((error: unknown) => {
      console.error("Failed to record match result", error);
    });
  }

  private clearTurnTimer(): void {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
  }
}
