import { describe, expect, it } from "vitest";
import { BONUS_CONFIG, GAME_CONFIG } from "@hex-duel/shared";
import type { BonusType, GroundBonus, PlayerState, Seat, Vector2 } from "@hex-duel/shared";
import { resolveTurn, type BonusContext } from "../turns/resolveTurn";
import { computeBonusPosition, generateBonusSchedule } from "./bonusPlanning";
import { segmentDistance } from "./pickups";
import { drawDistinctInts, mulberry32 } from "./seededRandom";

const player = (seat: Seat, x: number, z: number, crystals = 3): PlayerState => ({
  id: `p${seat}`,
  seat,
  position: { x, z },
  orientation: 0,
  crystals,
  isAlive: true,
});

const bonusContext = (ground: GroundBonus[] = [], armed: [BonusType | null, BonusType | null] = [null, null], seed = 1234): BonusContext => ({
  seed,
  ground,
  armed,
});

const orders = { 0: 1, 1: 2 };

describe("seeded PRNG", () => {
  it("produces the same sequence for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it("draws distinct integers in range", () => {
    const drawn = drawDistinctInts(mulberry32(7), 2, 22, 12);
    expect(drawn).toHaveLength(12);
    expect(new Set(drawn).size).toBe(12);
    for (const value of drawn) {
      expect(value).toBeGreaterThanOrEqual(2);
      expect(value).toBeLessThanOrEqual(22);
    }
  });
});

describe("generateBonusSchedule", () => {
  it("is deterministic: same seed -> same schedule", () => {
    expect(generateBonusSchedule(999)).toEqual(generateBonusSchedule(999));
  });

  it("differs between seeds (on a sample)", () => {
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
    const schedules = seeds.map((s) => JSON.stringify(generateBonusSchedule(s)));
    expect(new Set(schedules).size).toBeGreaterThan(1);
  });

  it("draws the documented quantities (total 12-16)", () => {
    for (const seed of [1, 42, 999, 31337]) {
      const schedule = generateBonusSchedule(seed);
      const count = (type: BonusType) => schedule.filter((s) => s.type === type).length;
      expect(count("REGEN")).toBeGreaterThanOrEqual(1);
      expect(count("REGEN")).toBeLessThanOrEqual(2);
      expect(count("ATTACK")).toBeGreaterThanOrEqual(4);
      expect(count("ATTACK")).toBeLessThanOrEqual(5);
      expect(count("MOVE")).toBeGreaterThanOrEqual(4);
      expect(count("MOVE")).toBeLessThanOrEqual(6);
      expect(count("SHIELD")).toBe(3);
      expect(schedule.length).toBeGreaterThanOrEqual(12);
      expect(schedule.length).toBeLessThanOrEqual(16);
    }
  });

  it("respects the spawn window, one spawn per turn, first at turn 2 or 3", () => {
    for (const seed of [1, 42, 999, 31337]) {
      const schedule = generateBonusSchedule(seed);
      const turns = schedule.map((s) => s.turn);
      expect(new Set(turns).size).toBe(turns.length);
      expect(turns[0]).toBeGreaterThanOrEqual(BONUS_CONFIG.firstSpawnTurnMin);
      expect(turns[0]).toBeLessThanOrEqual(BONUS_CONFIG.firstSpawnTurnMax);
      expect(Math.max(...turns)).toBeLessThanOrEqual(BONUS_CONFIG.lastSpawnTurn);
    }
  });

  it("never schedules a crystal (REGEN) as the first bonus", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const schedule = generateBonusSchedule(seed);
      expect(schedule[0]!.type).not.toBe("REGEN");
    }
  });
});

describe("computeBonusPosition", () => {
  it("is deterministic and inside the arena, spatially fair", () => {
    const positions: [Vector2, Vector2] = [
      { x: -6, z: 0 },
      { x: 6, z: 0 },
    ];
    const inside = (p: { x: number; z: number }) => Math.hypot(p.x, p.z) <= 10.5;
    for (const id of ["bonus-3-1", "bonus-5-2"]) {
      const a = computeBonusPosition(77, id, positions, inside);
      const b = computeBonusPosition(77, id, positions, inside);
      expect(a).toEqual(b);
      expect(inside(a)).toBe(true);
      const d0 = Math.hypot(a.x + 6, a.z);
      const d1 = Math.hypot(a.x - 6, a.z);
      expect(Math.abs(d0 - d1)).toBeLessThan(3);
    }
  });
});

describe("segmentDistance", () => {
  it("computes the distance from a point to a segment", () => {
    const a = { x: 0, z: 0 };
    const b = { x: 10, z: 0 };
    expect(segmentDistance(a, b, { x: 5, z: 1 })).toBeCloseTo(1);
    expect(segmentDistance(a, b, { x: -3, z: 0 })).toBeCloseTo(3);
    expect(segmentDistance(a, b, { x: 15, z: 0 })).toBeCloseTo(5);
  });
});

describe("resolveTurn with bonuses", () => {
  it("behaves identically without a bonus context (no bonus result)", () => {
    const resolution = resolveTurn(
      [player(0, -6, 0), player(1, 6, 0)],
      { 0: { type: "PASS" }, 1: { type: "PASS" } },
      orders,
      1,
    );
    expect(resolution.bonuses).toBeNull();
    expect(resolution.players[0].crystals).toBe(3);
  });

  it("spawns a bonus on its scheduled turn and exposes it in the state", () => {
    const seed = 42;
    const schedule = generateBonusSchedule(seed);
    const first = schedule[0]!;
    const resolution = resolveTurn(
      [player(0, -6, 0), player(1, 6, 0)],
      { 0: { type: "PASS" }, 1: { type: "PASS" } },
      orders,
      first.turn,
      bonusContext([], [null, null], seed),
    );
    expect(resolution.bonuses).not.toBeNull();
    expect(resolution.bonuses!.events.spawned).toHaveLength(1);
    expect(resolution.bonuses!.ground).toHaveLength(1);
    expect(resolution.bonuses!.ground[0]!.id).toBe(first.id);
    expect(resolution.bonuses!.ground[0]!.spawnTurn).toBe(first.turn);
  });

  it("does not spawn beyond the maximum on ground", () => {
    const seed = 42;
    const schedule = generateBonusSchedule(seed);
    const first = schedule[0]!;
    const ground: GroundBonus[] = [
      { id: "a", type: "MOVE", position: { x: 1, z: 1 }, spawnTurn: first.turn },
      { id: "b", type: "SHIELD", position: { x: -1, z: -1 }, spawnTurn: first.turn },
    ];
    const resolution = resolveTurn(
      [player(0, -6, 0), player(1, 6, 0)],
      { 0: { type: "PASS" }, 1: { type: "PASS" } },
      orders,
      first.turn,
      bonusContext(ground, [null, null], seed),
    );
    expect(resolution.bonuses!.events.spawned).toHaveLength(0);
    expect(resolution.bonuses!.ground).toHaveLength(2);
  });

  it("picks up by final position (REGEN applies immediately, capped at 3)", () => {
    const ground: GroundBonus[] = [
      { id: "regen-1", type: "REGEN", position: { x: -1, z: 0 }, spawnTurn: 2 },
    ];
    const resolution = resolveTurn(
      [player(0, -6, 0, 2), player(1, 6, 0)],
      { 0: { type: "MOVE", target: { x: -1, z: 0 } }, 1: { type: "PASS" } },
      orders,
      2,
      bonusContext(ground),
    );
    expect(resolution.bonuses!.events.pickups).toMatchObject([
      { seat: 0, bonus: { id: "regen-1", type: "REGEN" }, method: "POSITION" },
    ]);
    expect(resolution.bonuses!.events.regen).toEqual([{ seat: 0, crystalsAfter: 3 }]);
    expect(resolution.players[0].crystals).toBe(3);
    expect(resolution.bonuses!.ground).toHaveLength(0);
    expect(resolution.bonuses!.armed[0]).toBeNull();
  });

  it("picks up by trajectory crossing the bonus", () => {
    const ground: GroundBonus[] = [
      { id: "move-1", type: "MOVE", position: { x: -2, z: 0.9 }, spawnTurn: 2 },
    ];
    // Moves from -6 to -1 (5 units, legal); the path passes within the
    // pickup radius of the bonus but the final position does not
    // (distance ~1.35 > 1.3).
    const resolution = resolveTurn(
      [player(0, -6, 0), player(1, 6, 0)],
      { 0: { type: "MOVE", target: { x: -1, z: 0 } }, 1: { type: "PASS" } },
      orders,
      2,
      bonusContext(ground),
    );
    expect(resolution.bonuses!.events.pickups[0]).toMatchObject({
      seat: 0,
      bonus: { id: "move-1" },
      method: "TRAJECTORY",
    });
    expect(resolution.bonuses!.armed[0]).toBe("MOVE");
  });

  it("picks up by attack zone covering the bonus, and the attack resolves normally", () => {
    const ground: GroundBonus[] = [
      { id: "shield-1", type: "SHIELD", position: { x: -1, z: 0 }, spawnTurn: 2 },
    ];
    // Player 0 attacks toward +X: the target (6,0) is out of STRIKE range (6,
    // edge) but the bonus at (-1,0) is inside the cone.
    const resolution = resolveTurn(
      [player(0, -6, 0), player(1, 6, 0)],
      { 0: { type: "STRIKE", direction: 0 }, 1: { type: "PASS" } },
      orders,
      2,
      bonusContext(ground),
    );
    expect(resolution.bonuses!.events.pickups[0]).toMatchObject({
      seat: 0,
      bonus: { id: "shield-1" },
      method: "ATTACK",
    });
    expect(resolution.bonuses!.armed[0]).toBe("SHIELD");
    expect(resolution.attacks).toHaveLength(1);
  });

  it("nobody gets a bonus both players pick the same turn (D-196)", () => {
    const ground: GroundBonus[] = [
      { id: "atk-1", type: "ATTACK", position: { x: 0, z: 0 }, spawnTurn: 2 },
    ];
    const resolution = resolveTurn(
      [player(0, -1, 0), player(1, 1, 0)],
      { 0: { type: "MOVE", target: { x: 0, z: 0 } }, 1: { type: "MOVE", target: { x: 0, z: 0 } } },
      orders,
      2,
      bonusContext(ground),
    );
    expect(resolution.bonuses!.events.contested).toEqual(["atk-1"]);
    expect(resolution.bonuses!.events.pickups).toHaveLength(0);
    expect(resolution.bonuses!.ground[0]!.id).toBe("atk-1");
    expect(resolution.bonuses!.armed).toEqual([null, null]);
  });

  it("expires a bonus after its spawn turn + the next turn (D-198)", () => {
    // A filler keeps the ground full so the seed schedule cannot spawn.
    const ground: GroundBonus[] = [
      { id: "old", type: "MOVE", position: { x: 3, z: 3 }, spawnTurn: 2 },
      { id: "filler", type: "SHIELD", position: { x: -3, z: -3 }, spawnTurn: 3 },
    ];
    const alive = resolveTurn(
      [player(0, -6, 0), player(1, 6, 0)],
      { 0: { type: "PASS" }, 1: { type: "PASS" } },
      orders,
      3,
      bonusContext(ground),
    );
    expect(alive.bonuses!.ground.map((b) => b.id)).toEqual(["old", "filler"]);

    const expired = resolveTurn(
      [player(0, -6, 0), player(1, 6, 0)],
      { 0: { type: "PASS" }, 1: { type: "PASS" } },
      orders,
      4,
      bonusContext(alive.bonuses!.ground),
    );
    expect(expired.bonuses!.events.expired).toEqual(["old"]);
    expect(expired.bonuses!.ground.map((b) => b.id)).toEqual(["filler"]);
  });

  it("applies the MOVE boost (5 -> 7) and consumes it", () => {
    const resolution = resolveTurn(
      [player(0, -6, 0), player(1, 6, 0)],
      { 0: { type: "MOVE", target: { x: 1, z: 0 } }, 1: { type: "PASS" } },
      orders,
      2,
      bonusContext([], ["MOVE", null]),
    );
    // Distance 7: out of base range (5) but within the boosted range.
    expect(Math.hypot(resolution.players[0].position.x + 6, 0)).toBeCloseTo(7);
    expect(resolution.bonuses!.events.consumed).toEqual([{ seat: 0, type: "MOVE" }]);
    expect(resolution.bonuses!.armed[0]).toBeNull();
  });

  it("rejects a 7-unit move without the boost", () => {
    const resolution = resolveTurn(
      [player(0, -6, 0), player(1, 6, 0)],
      { 0: { type: "MOVE", target: { x: 1, z: 0 } }, 1: { type: "PASS" } },
      orders,
      2,
      bonusContext(),
    );
    expect(resolution.movementsCancelled).toBe(true);
  });

  it("applies the ATTACK boost (STRIKE 6/90 -> 8/180) and consumes it", () => {
    // Target at distance 7.5, 60deg off-axis: out of base STRIKE
    // (range 6, half-angle 45), inside boosted (range 8, half-angle 90).
    const target = player(1, -6 + 7.5 * Math.cos(1.05), 7.5 * Math.sin(1.05));
    const resolution = resolveTurn(
      [player(0, -6, 0), target],
      { 0: { type: "STRIKE", direction: 0 }, 1: { type: "PASS" } },
      orders,
      2,
      bonusContext([], ["ATTACK", null]),
    );
    expect(resolution.attacks[0]!.hits).toBe(true);
    expect(resolution.players[1].crystals).toBe(2);
    expect(resolution.bonuses!.events.consumed).toEqual([{ seat: 0, type: "ATTACK" }]);
  });

  it("applies the ATTACK boost (SNIPER 10/10 -> 12/25) and consumes it", () => {
    // Target at distance 11, ~11.5deg off-axis: outside base SNIPER (range
    // 10), inside boosted (range 12, 12.5deg half-angle).
    const target = player(1, -6 + 11 * Math.cos(0.2), 11 * Math.sin(0.2));
    const resolution = resolveTurn(
      [player(0, -6, 0), target],
      { 0: { type: "SNIPER", direction: 0 }, 1: { type: "PASS" } },
      orders,
      2,
      bonusContext([], ["ATTACK", null]),
    );
    expect(resolution.attacks[0]!.hits).toBe(true);
    expect(resolution.bonuses!.events.consumed).toEqual([{ seat: 0, type: "ATTACK" }]);
  });

  it("absorbs a hit with the SHIELD bonus and consumes it", () => {
    const resolution = resolveTurn(
      [player(0, -6, 0), player(1, -4, 0)],
      { 0: { type: "STRIKE", direction: 0 }, 1: { type: "PASS" } },
      orders,
      2,
      bonusContext([], [null, "SHIELD"]),
    );
    expect(resolution.attacks[0]!.hits).toBe(true);
    expect(resolution.attacks[0]!.absorbedByShield).toBe(true);
    expect(resolution.players[1].crystals).toBe(3);
    expect(resolution.bonuses!.events.shieldAbsorbed).toEqual([{ seat: 1 }]);
    expect(resolution.bonuses!.events.consumed).toContainEqual({ seat: 1, type: "SHIELD" });
    expect(resolution.bonuses!.armed[1]).toBeNull();
  });

  it("does nothing when a full-crystals player touches a crystal bonus", () => {
    const ground: GroundBonus[] = [
      { id: "regen-full", type: "REGEN", position: { x: -1, z: 0 }, spawnTurn: 2 },
    ];
    const resolution = resolveTurn(
      [player(0, -6, 0, 3), player(1, 6, 0)],
      { 0: { type: "MOVE", target: { x: -1, z: 0 } }, 1: { type: "PASS" } },
      orders,
      2,
      bonusContext(ground),
    );
    expect(resolution.bonuses!.events.pickups).toHaveLength(0);
    expect(resolution.bonuses!.events.regen).toHaveLength(0);
    expect(resolution.players[0].crystals).toBe(3);
    // The bonus stays on the ground.
    expect(resolution.bonuses!.ground.map((b) => b.id)).toEqual(["regen-full"]);
  });

  it("replaces the armed bonus on a new pickup (single slot, D-194)", () => {
    const ground: GroundBonus[] = [
      { id: "atk-2", type: "ATTACK", position: { x: -1, z: 0 }, spawnTurn: 2 },
    ];
    const resolution = resolveTurn(
      [player(0, -6, 0), player(1, 6, 0)],
      { 0: { type: "MOVE", target: { x: -1, z: 0 } }, 1: { type: "PASS" } },
      orders,
      2,
      bonusContext(ground, ["MOVE", null]),
    );
    expect(resolution.bonuses!.armed[0]).toBe("ATTACK");
    expect(resolution.bonuses!.ground).toHaveLength(0);
  });

  it("keeps the base values exact (5, 6/90, 10/10)", () => {
    expect(GAME_CONFIG.maxMoveDistance).toBe(5);
    expect(GAME_CONFIG.attacks.STRIKE).toEqual({ range: 6, angle: 90 });
    expect(GAME_CONFIG.attacks.SNIPER).toEqual({ range: 10, angle: 10 });
    expect(BONUS_CONFIG.boosted.moveDistance).toBe(7);
    expect(BONUS_CONFIG.boosted.attacks.STRIKE).toEqual({ range: 8, angle: 180 });
    expect(BONUS_CONFIG.boosted.attacks.SNIPER).toEqual({ range: 12, angle: 25 });
  });
});
