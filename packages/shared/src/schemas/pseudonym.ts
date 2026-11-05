import { z } from "zod";

/**
 * Guest pseudonym validation (D-080/081). Reusable client and server side.
 * 3-24 characters, letters/digits/spaces/hyphens/underscores, accents allowed.
 */
export const PseudonymSchema = z
  .string()
  .trim()
  .min(3)
  .max(24)
  .regex(/^[\p{L}\p{N} _-]+$/u);

export const PSEUDONYM_MIN_LENGTH = 3;
export const PSEUDONYM_MAX_LENGTH = 24;

const GUEST_PREFIX = "hd-player-";
const GUEST_SUFFIX_LENGTH = 10;
const GUEST_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generates a guest pseudonym: "hd-player-" + 10 random lowercase
 * alphanumeric characters (D-081). Not an identity - display data only.
 */
export const generateGuestPseudonym = (): string => {
  let suffix = "";
  for (let i = 0; i < GUEST_SUFFIX_LENGTH; i++) {
    suffix += GUEST_ALPHABET[Math.floor(Math.random() * GUEST_ALPHABET.length)] ?? "";
  }
  return GUEST_PREFIX + suffix;
};
