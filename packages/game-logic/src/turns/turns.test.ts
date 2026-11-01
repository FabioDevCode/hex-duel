import { describe, expect, it } from "vitest";
import type { PlayerState } from "@hex-duel/shared";
import { resolveTurn } from "./resolveTurn";
import { determineWinner } from "./determineWinner";
import { simulateGame } from "../simulation/gameSimulation";

const player = (seat: 0 | 1, pos: { x: number; z: number }, crystals = 3): PlayerState => ({
  id: `p${seat}`,
  seat,
  position: pos,
  orientation: 0,
  crystals,
  isAlive: crystals > 0,
});

const players = () =>
  [player(0, { x: -5, z: 0 }), player(1, { x: 5, z: 0 })] as [PlayerState, PlayerState];

describe("resolveTurn", () => {
  it("applies movement then attack with final positions (D-044)", () => {
    const res = resolveTurn(
      players(),
      {
        0: { type: "MOVE", target: { x: -2, z: 0 } },
        1: { type: "PASS" },
      },
      { 0: 1, 1: 2 },
      1,
    );
    expect(res.players[0].position).toEqual({ x: -2, z: 0 });
    expect(res.finished).toBe(false);
  });

  it("resolves both attacks sequentially by validation order (D-050)", () => {
    const res = resolveTurn(
      [player(0, { x: -1, z: 0 }), player(1, { x: 1, z: 0 })],
      {
        0: { type: "SWEEP", direction: 0 },
        1: { type: "SWEEP", direction: 180 },
      },
      { 0: 2, 1: 1 },
      1,
    );
    expect(res.attacks[0]?.attackerSeat).toBe(1);
    expect(res.players[0].crystals).toBe(2);
  });

  it("does not execute the second attack when the first eliminates (D-054)", () => {
    const res = resolveTurn(
      [player(0, { x: -1, z: 0 }, 1), player(1, { x: 1, z: 0 })],
      {
        0: { type: "PASS" },
        1: { type: "SWEEP", direction: 180 },
      },
      { 0: 1, 1: 2 },
      1,
    );
    expect(res.attacks).toHaveLength(1);
    expect(res.finished).toBe(true);
    expect(res.winner).toEqual({ outcome: "WIN", winnerSeat: 1 });
  });

  it("is deterministic: same inputs give same outputs (§8.8)", () => {
    const run = () =>
      resolveTurn(
        players(),
        {
          0: { type: "STRIKE", direction: 0 },
          1: { type: "MOVE", target: { x: 4, z: 0 } },
        },
        { 0: 1, 1: 1 },
        1,
      );
    expect(run()).toEqual(run());
  });
});

describe("determineWinner", () => {
  it("declares a draw when both are eliminated in the same turn", () => {
    const res = determineWinner(
      [player(0, { x: 0, z: 0 }, 0), player(1, { x: 1, z: 0 }, 0)],
      1,
    );
    expect(res.result).toEqual({ outcome: "DRAW" });
  });

  it("awards the win by HP at turn 30", () => {
    const res = determineWinner(
      [player(0, { x: 0, z: 0 }, 2), player(1, { x: 1, z: 0 }, 1)],
      30,
    );
    expect(res.result).toEqual({ outcome: "WIN", winnerSeat: 0 });
  });

  it("declares a draw on equal HP at turn 30", () => {
    const res = determineWinner(
      [player(0, { x: 0, z: 0 }, 2), player(1, { x: 1, z: 0 }, 2)],
      30,
    );
    expect(res.result).toEqual({ outcome: "DRAW" });
  });

  it("does not finish before turn 30 with both alive", () => {
    const res = determineWinner(players(), 29);
    expect(res.finished).toBe(false);
  });
});

describe("simulateGame", () => {
  it("runs multiple turns to completion", () => {
    const sim = simulateGame(players(), [
      { actions: { 0: { type: "PASS" }, 1: { type: "PASS" } }, validationOrders: { 0: 1, 1: 2 } },
      { actions: { 0: { type: "SWEEP", direction: 0 }, 1: { type: "PASS" } }, validationOrders: { 0: 1, 1: 2 } },
    ]);
    expect(sim.turns).toHaveLength(2);
    expect(sim.finished).toBe(false);
  });
});
