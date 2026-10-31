import type { Seat } from "@hex-duel/shared";
import { resolveTieBreak } from "./tieBreak";

/**
 * Attack priority: the action validated first (lower validationOrder) is
 * resolved first (D-051). On exact tie, the deterministic seat-based rule
 * applies (D-053, P-004 pending arbitration).
 */
export const attackPriority = (
  orders: Readonly<Record<Seat, number>>,
): [Seat, Seat] => {
  const order0 = orders[0];
  const order1 = orders[1];
  if (order0 === order1) {
    const tieWinner = resolveTieBreak();
    return tieWinner === 0 ? [0, 1] : [1, 0];
  }
  return order0 < order1 ? [0, 1] : [1, 0];
};
