import { describe, expect, it } from "vitest";
import { buildArenaBounds, isInsideArena } from "./positionValidation";

describe("arena bounds (P-002/P-003 default proposal)", () => {
  const bounds = buildArenaBounds();

  it("accepts the center", () => {
    expect(isInsideArena({ x: 0, z: 0 }, bounds)).toBe(true);
  });

  it("accepts a point inside the hexagon", () => {
    expect(isInsideArena({ x: 10, z: 0 }, bounds)).toBe(true);
  });

  it("rejects a point outside the hexagon", () => {
    expect(isInsideArena({ x: 13, z: 0 }, bounds)).toBe(false);
    expect(isInsideArena({ x: 0, z: 13 }, bounds)).toBe(false);
  });

  it("is smaller than the bounding circle at a flat side", () => {
    expect(isInsideArena({ x: 0, z: 11.9 }, bounds)).toBe(false);
  });
});
