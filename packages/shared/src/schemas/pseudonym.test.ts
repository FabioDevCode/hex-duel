import { describe, expect, it } from "vitest";
import {
  PSEUDONYM_MAX_LENGTH,
  PSEUDONYM_MIN_LENGTH,
  PseudonymSchema,
  generateGuestPseudonym,
} from "./pseudonym";

describe("PseudonymSchema", () => {
  it("accepts a simple valid pseudonym", () => {
    const result = PseudonymSchema.safeParse("HexDuel");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("HexDuel");
  });

  it("accepts letters, digits, spaces, hyphens, underscores and accents", () => {
    expect(PseudonymSchema.safeParse("Jean-Pierre_2").success).toBe(true);
    expect(PseudonymSchema.safeParse("Élite Ñoño").success).toBe(true);
    expect(PseudonymSchema.safeParse("a b").success).toBe(true);
  });

  it("trims surrounding whitespace before validating", () => {
    const result = PseudonymSchema.safeParse("  HexDuel  ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("HexDuel");
  });

  it("rejects pseudonyms shorter than 3 characters (after trim)", () => {
    expect(PseudonymSchema.safeParse("ab").success).toBe(false);
    expect(PseudonymSchema.safeParse("  ab  ").success).toBe(false);
  });

  it("rejects pseudonyms longer than 24 characters", () => {
    expect(PseudonymSchema.safeParse("a".repeat(24)).success).toBe(true);
    expect(PseudonymSchema.safeParse("a".repeat(25)).success).toBe(false);
  });

  it("rejects forbidden characters (symbols, emoji)", () => {
    expect(PseudonymSchema.safeParse("hex<duel>").success).toBe(false);
    expect(PseudonymSchema.safeParse("hex@duel").success).toBe(false);
    expect(PseudonymSchema.safeParse("hex🎉duel").success).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(PseudonymSchema.safeParse(42).success).toBe(false);
    expect(PseudonymSchema.safeParse(null).success).toBe(false);
  });

  it("exposes the documented length bounds", () => {
    expect(PSEUDONYM_MIN_LENGTH).toBe(3);
    expect(PSEUDONYM_MAX_LENGTH).toBe(24);
  });
});

describe("generateGuestPseudonym", () => {
  it("matches the guest format hd-player-<10 lowercase alphanumerics>", () => {
    const pseudo = generateGuestPseudonym();
    expect(pseudo).toMatch(/^hd-player-[a-z0-9]{10}$/);
  });

  it("has the documented length (10 + prefix, within the schema bounds)", () => {
    const pseudo = generateGuestPseudonym();
    expect(pseudo.length).toBe("hd-player-".length + 10);
    expect(PseudonymSchema.safeParse(pseudo).success).toBe(true);
  });

  it("is unique on a sample of generations", () => {
    const samples = new Set<string>();
    for (let i = 0; i < 1000; i++) samples.add(generateGuestPseudonym());
    expect(samples.size).toBe(1000);
  });
});
