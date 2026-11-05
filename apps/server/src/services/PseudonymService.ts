import { PseudonymSchema, generateGuestPseudonym } from "@hex-duel/shared";

/**
 * Join-time pseudonym resolution (D-080/083). The client-provided value is
 * ALWAYS validated server side; anything absent or invalid falls back to a
 * server-generated guest pseudonym. The pseudonym is display data only -
 * the identity remains the guest player id + session token.
 */
export const resolveJoinPseudonym = (candidate: unknown): string => {
  const parsed = PseudonymSchema.safeParse(candidate);
  return parsed.success ? parsed.data : generateGuestPseudonym();
};
