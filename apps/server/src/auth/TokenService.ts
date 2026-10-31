import { randomBytes, createHash } from "node:crypto";

/** Server-generated secure session token (D-082, MULTIPLAYER_SPEC 6.3). */
export const generateToken = (): string => randomBytes(32).toString("base64url");

export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");
