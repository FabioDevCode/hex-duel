import type { Seat } from "@hex-duel/shared";

/**
 * P-004 (PENDING): the exact tie-break rule between seats 0 and 1 is not
 * arbitrated yet. Default proposal: seat 0 wins the tie (stable, deterministic,
 * identical for a same game state). Awaiting arbitration; do not treat as validated.
 */
export const DEFAULT_TIE_BREAK_WINNER: Seat = 0;

export const resolveTieBreak = (): Seat => DEFAULT_TIE_BREAK_WINNER;
