import { describe, expect, it } from "vitest";
import { GameService } from "./GameService";

describe("GameService", () => {
  it("accepts a valid action and assigns the validation order", () => {
    const game = new GameService({ 0: "a", 1: "b" });
    const result = game.submit(0, { type: "PASS" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.order).toBe(1);
    expect(game.hasValidated(0)).toBe(true);
    expect(game.bothValidated()).toBe(false);
  });

  it("rejects a duplicate submission (idempotence, §9.4)", () => {
    const game = new GameService({ 0: "a", 1: "b" });
    game.submit(0, { type: "PASS" });
    const second = game.submit(0, { type: "PASS" });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.code).toBe("ACTION_ALREADY_SUBMITTED");
  });

  it("rejects a malformed action without mutating state", () => {
    const game = new GameService({ 0: "a", 1: "b" });
    const bad = game.submit(0, { type: "STRIKE", direction: Number.NaN });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.code).toBe("INVALID_ACTION");
    expect(game.hasValidated(0)).toBe(false);
  });

  it("clamps an out-of-range MOVE to the maximum distance instead of rejecting", () => {
    const game = new GameService({ 0: "a", 1: "b" });
    const result = game.submit(0, { type: "MOVE", target: { x: -12, z: 0 } });
    expect(result.ok).toBe(true);
    const resolution = game.resolveCurrentTurn(1);
    // From (-6,0) toward (-12,0): 6 units requested, clamped to 5 -> (-11,0)
    expect(resolution.players[0].position.x).toBe(-11);
    expect(resolution.players[0].position.z).toBe(0);
  });

  it("applies PASS to missing submissions at resolution (D-024)", () => {
    const game = new GameService({ 0: "a", 1: "b" });
    game.submit(0, { type: "PASS" });
    const resolution = game.resolveCurrentTurn(1);
    expect(resolution.finished).toBe(false);
    expect(game.hasValidated(0)).toBe(false);
  });

  it("resolves a full turn and resets submissions", () => {
    const game = new GameService({ 0: "a", 1: "b" });
    game.submit(0, { type: "MOVE", target: { x: -5, z: 0 } });
    game.submit(1, { type: "PASS" });
    const resolution = game.resolveCurrentTurn(1);
    expect(resolution.players[0].position.x).toBe(-5);
    expect(game.bothValidated()).toBe(false);
  });
});
