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
    const bad = game.submit(0, { type: "SWEEP", direction: Number.NaN });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.code).toBe("INVALID_ACTION");
    expect(game.hasValidated(0)).toBe(false);
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
