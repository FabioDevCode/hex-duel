import { randomUUID } from "node:crypto";
import { generateToken, hashToken } from "./TokenService";

export type GuestSession = {
  playerId: string;
  tokenHash: string;
};

/**
 * Guest identification (D-080..D-083): server assigns the player id and
 * a secure token. Only the token hash is stored; the raw token is returned
 * once to the client and never exposed to the opponent.
 */
export class GuestAuthService {
  private readonly sessions = new Map<string, GuestSession>();

  createSession(): { playerId: string; token: string } {
    const playerId = randomUUID();
    const token = generateToken();
    this.sessions.set(playerId, { playerId, tokenHash: hashToken(token) });
    return { playerId, token };
  }

  verify(playerId: string, token: string): boolean {
    const session = this.sessions.get(playerId);
    if (!session) return false;
    return session.tokenHash === hashToken(token);
  }
}
