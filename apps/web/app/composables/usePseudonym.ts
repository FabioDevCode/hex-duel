import { useState } from "nuxt/app";
import { PseudonymSchema, generateGuestPseudonym } from "@hex-duel/shared";

/**
 * Browser-side guest pseudonym (D-080/081). Generated once on the first
 * visit and persisted in localStorage: it is the player's permanent
 * pseudonym, not a throwaway per-game one. Display data only - the
 * identity remains the guest player id + session (D-082/083).
 */

const STORAGE_KEY = "hex-duel:pseudo";

export type PseudonymResult = { ok: true } | { ok: false; error: "INVALID" };

export const usePseudonym = () => {
  const pseudonym = useState<string>("player-pseudonym", () => {
    if (!import.meta.client) return "";
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && PseudonymSchema.safeParse(stored).success) return stored;
    // First visit (or an invalid stored value): generate and persist
    // immediately so the pseudonym becomes permanent.
    const generated = generateGuestPseudonym();
    localStorage.setItem(STORAGE_KEY, generated);
    return generated;
  });

  /** Validates via PseudonymSchema and persists; the UI shows the error. */
  const setPseudonym = (value: string): PseudonymResult => {
    const parsed = PseudonymSchema.safeParse(value);
    if (!parsed.success) return { ok: false, error: "INVALID" };
    pseudonym.value = parsed.data;
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, parsed.data);
    return { ok: true };
  };

  return { pseudonym, setPseudonym };
};
