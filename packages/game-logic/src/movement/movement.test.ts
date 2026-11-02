import { describe, expect, it } from "vitest";
import { buildArenaBounds, isInsideArena } from "../arena/positionValidation";
import { calculateMovement, isWithinMaxDistance } from "./calculateMovement";
import { resolveMovement } from "./resolveMovement";
import { positionsOverlap } from "../collision/resolvePlayerCollision";
import type { PlayerState } from "@hex-duel/shared";

const bounds = buildArenaBounds();
const inside = (p: { x: number; z: number }) => isInsideArena(p, bounds);

const player = (seat: 0 | 1, pos: { x: number; z: number }): PlayerState => ({
  id: `p${seat}`,
  seat,
  position: pos,
  orientation: 0,
  crystals: 3,
  isAlive: true,
});

describe("calculateMovement", () => {
  it("accepts a move within distance and arena", () => {
    const result = calculateMovement({ x: 0, z: 0 }, { x: 2, z: 1 }, inside);
    expect(result.ok).toBe(true);
  });

  it("rejects a move too far (> 5 units)", () => {
    const result = calculateMovement({ x: 0, z: 0 }, { x: 6, z: 0 }, inside);
    expect(result).toEqual({ ok: false, error: "TOO_FAR" });
  });

  it("rejects a move out of the arena", () => {
    const result = calculateMovement({ x: 11, z: 0 }, { x: 13.5, z: 0 }, inside);
    expect(result).toEqual({ ok: false, error: "OUT_OF_ARENA" });
  });

  it("accepts exactly the max distance (3 units)", () => {
    expect(isWithinMaxDistance({ x: 0, z: 0 }, { x: 3, z: 0 })).toBe(true);
  });
});

describe("resolveMovement", () => {
  it("applies both moves simultaneously", () => {
    const players = [player(0, { x: -5, z: 0 }), player(1, { x: 5, z: 0 })] as const;
    const outcome = resolveMovement(
      players,
      [{ type: "MOVE", target: { x: -4, z: 1 } }, { type: "MOVE", target: { x: 4, z: 1 } }],
      inside,
      positionsOverlap,
    );
    expect(outcome.moved).toBe(true);
    if (outcome.moved) {
      expect(outcome.players[0].position).toEqual({ x: -4, z: 1 });
      expect(outcome.players[1].position).toEqual({ x: 4, z: 1 });
    }
  });

  it("cancels both moves on final overlap (D-035)", () => {
    const players = [player(0, { x: -2, z: 0 }), player(1, { x: 2, z: 0 })] as const;
    const outcome = resolveMovement(
      players,
      [{ type: "MOVE", target: { x: 0, z: 0 } }, { type: "MOVE", target: { x: 0.2, z: 0 } }],
      inside,
      positionsOverlap,
    );
    expect(outcome.moved).toBe(false);
    if (!outcome.moved) expect(outcome.reason).toBe("COLLISION");
  });

  it("allows crossing trajectories (D-034)", () => {
    const players = [player(0, { x: -1.5, z: 0 }), player(1, { x: 1.5, z: 0 })] as const;
    const outcome = resolveMovement(
      players,
      [{ type: "MOVE", target: { x: 1.5, z: 0 } }, { type: "MOVE", target: { x: -1.5, z: 0 } }],
      inside,
      positionsOverlap,
    );
    expect(outcome.moved).toBe(true);
  });
});
