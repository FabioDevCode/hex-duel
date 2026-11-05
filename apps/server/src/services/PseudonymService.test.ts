import { describe, expect, it } from "vitest";
import { PseudonymSchema } from "@hex-duel/shared";
import { resolveJoinPseudonym } from "./PseudonymService";

describe("resolveJoinPseudonym", () => {
  it("keeps a valid client pseudonym", () => {
    expect(resolveJoinPseudonym("Kévin-Le-Bleu")).toBe("Kévin-Le-Bleu");
  });

  it("trims the client pseudonym", () => {
    expect(resolveJoinPseudonym("  HexDuel  ")).toBe("HexDuel");
  });

  it("generates a guest pseudonym when absent", () => {
    const resolved = resolveJoinPseudonym(undefined);
    expect(resolved).toMatch(/^hd-player-[a-z0-9]{10}$/);
  });

  it("generates a guest pseudonym when invalid (too short)", () => {
    expect(resolveJoinPseudonym("ab")).toMatch(/^hd-player-[a-z0-9]{10}$/);
  });

  it("generates a guest pseudonym when invalid (forbidden characters)", () => {
    expect(resolveJoinPseudonym("hacker<script>")).toMatch(/^hd-player-[a-z0-9]{10}$/);
  });

  it("generates a guest pseudonym for non-string values", () => {
    expect(resolveJoinPseudonym(42)).toMatch(/^hd-player-[a-z0-9]{10}$/);
    expect(resolveJoinPseudonym(null)).toMatch(/^hd-player-[a-z0-9]{10}$/);
  });

  it("always returns a schema-valid pseudonym", () => {
    for (const candidate of [undefined, "ab", "<x>", 42, "Valid Pseudo"]) {
      expect(PseudonymSchema.safeParse(resolveJoinPseudonym(candidate)).success).toBe(true);
    }
  });
});
