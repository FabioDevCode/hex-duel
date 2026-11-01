import { describe, expect, it } from "vitest";
import {
  ClientMessageSchema,
  GAME_CONFIG,
  PlayerActionSchema,
  isAttackAction,
} from "../index";

describe("PlayerActionSchema", () => {
  it("accepts a valid MOVE action", () => {
    const action = { type: "MOVE", target: { x: 1.5, z: -2 } };
    expect(PlayerActionSchema.parse(action)).toEqual(action);
  });

  it("accepts a valid SWEEP attack", () => {
    const action = { type: "SWEEP", direction: 90 };
    expect(PlayerActionSchema.parse(action)).toEqual(action);
  });

  it("accepts a valid PASS", () => {
    expect(PlayerActionSchema.parse({ type: "PASS" })).toEqual({ type: "PASS" });
  });

  it("rejects an unknown action type", () => {
    expect(() =>
      PlayerActionSchema.parse({ type: "DANCE", direction: 0 }),
    ).toThrow();
  });

  it("rejects a MOVE with a NaN coordinate", () => {
    expect(() =>
      PlayerActionSchema.parse({ type: "MOVE", target: { x: Number.NaN, z: 0 } }),
    ).toThrow();
  });

  it("rejects a missing target on MOVE", () => {
    expect(() => PlayerActionSchema.parse({ type: "MOVE" })).toThrow();
  });
});

describe("ClientMessageSchema", () => {
  it("accepts a valid submit_action message", () => {
    const message = {
      type: "submit_action",
      actionId: "action-1",
      action: { type: "PASS" },
    };
    expect(ClientMessageSchema.parse(message)).toEqual(message);
  });

  it("rejects submit_action without actionId (idempotence)", () => {
    expect(() =>
      ClientMessageSchema.parse({ type: "submit_action", action: { type: "PASS" } }),
    ).toThrow();
  });

  it("rejects malformed payloads", () => {
    expect(() => ClientMessageSchema.parse({ type: "submit_action" })).toThrow();
    expect(() => ClientMessageSchema.parse({ type: "unknown" })).toThrow();
    expect(() => ClientMessageSchema.parse(null)).toThrow();
  });
});

describe("GAME_CONFIG", () => {
  it("matches the accepted GDD values", () => {
    expect(GAME_CONFIG.maxMoveDistance).toBe(3);
    expect(GAME_CONFIG.turnDurationMs).toBe(30_000);
    expect(GAME_CONFIG.maxCrystals).toBe(3);
    expect(GAME_CONFIG.attacks.SNIPER.range).toBe(12);
  });

  it("keeps collisionRadius pending arbitration (P-001)", () => {
    expect(GAME_CONFIG.collisionRadius).toBe(0);
  });
});

describe("isAttackAction", () => {
  it("narrows attack actions", () => {
    expect(isAttackAction({ type: "STRIKE", direction: 0 })).toBe(true);
    expect(isAttackAction({ type: "PASS" })).toBe(false);
    expect(isAttackAction({ type: "MOVE", target: { x: 0, z: 0 } })).toBe(false);
  });
});
