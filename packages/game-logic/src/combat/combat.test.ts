import { describe, expect, it } from "vitest";
import { GAME_CONFIG } from "@hex-duel/shared";
import type { PlayerState } from "@hex-duel/shared";
import { checkAttack, distanceBetween } from "./calculateAttack";
import { calculateDamage } from "./calculateDamage";
import { attackPriority } from "../turns/attackPriority";

const player = (seat: 0 | 1, pos: { x: number; z: number }, hp = 100): PlayerState => ({
  id: `p${seat}`,
  seat,
  position: pos,
  orientation: 0,
  hp,
  isAlive: hp > 0,
});

describe("checkAttack", () => {
  it("computes distance between centers (D-042)", () => {
    expect(distanceBetween({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5);
  });

  it("hits a target in range and angle", () => {
    const params = GAME_CONFIG.attacks.STRIKE;
    const check = checkAttack(
      { x: 0, z: 0 },
      { x: 3, z: 0 },
      { type: "STRIKE", direction: 0 },
      params,
    );
    expect(check.hits).toBe(true);
  });

  it("misses a target out of range", () => {
    const params = GAME_CONFIG.attacks.SWEEP;
    const check = checkAttack(
      { x: 0, z: 0 },
      { x: 3, z: 0 },
      { type: "SWEEP", direction: 0 },
      params,
    );
    expect(check.inRange).toBe(false);
    expect(check.hits).toBe(false);
  });

  it("misses a target outside the cone angle", () => {
    const params = GAME_CONFIG.attacks.SNIPER;
    const check = checkAttack(
      { x: 0, z: 0 },
      { x: 5, z: 1 },
      { type: "SNIPER", direction: 0 },
      params,
    );
    expect(check.inAngle).toBe(false);
    expect(check.hits).toBe(false);
  });

  it("SNIPER hits within its narrow 10-degree cone", () => {
    const params = GAME_CONFIG.attacks.SNIPER;
    const check = checkAttack(
      { x: 0, z: 0 },
      { x: 10, z: 0.4 },
      { type: "SNIPER", direction: 0 },
      params,
    );
    expect(check.hits).toBe(true);
  });
});

describe("calculateDamage", () => {
  it("applies damage on a hit", () => {
    const outcome = calculateDamage(player(0, { x: 0, z: 0 }), player(1, { x: 2, z: 0 }), "SWEEP", 0);
    expect(outcome.hits).toBe(true);
    expect(outcome.damage).toBe(GAME_CONFIG.attacks.SWEEP.damage);
    expect(outcome.targetHpAfter).toBe(75);
  });

  it("applies zero damage on a miss", () => {
    const outcome = calculateDamage(player(0, { x: 0, z: 0 }), player(1, { x: 10, z: 0 }), "SWEEP", 0);
    expect(outcome.hits).toBe(false);
    expect(outcome.damage).toBe(0);
    expect(outcome.targetHpAfter).toBe(100);
  });

  it("clamps HP at zero", () => {
    const outcome = calculateDamage(player(0, { x: 0, z: 0 }), player(1, { x: 2, z: 0 }, 10), "SWEEP", 0);
    expect(outcome.targetHpAfter).toBe(0);
    expect(outcome.targetAlive).toBe(false);
  });
});

describe("attackPriority", () => {
  it("resolves the first-validated attack first (D-051)", () => {
    expect(attackPriority({ 0: 2, 1: 1 })).toEqual([1, 0]);
  });

  it("falls back to deterministic seat tie-break (D-053, P-004 pending)", () => {
    expect(attackPriority({ 0: 1, 1: 1 })).toEqual([0, 1]);
  });
});
