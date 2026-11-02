export const GAME_CONFIG = {
  maxCrystals: 3,
  turnDurationMs: 30_000,
  maxTurns: 30,
  arenaRadius: 12,
  maxMoveDistance: 5,
  collisionRadius: 0,
  attacks: {
    STRIKE: {
      range: 5,
      angle: 90,
    },
    SNIPER: {
      range: 10,
      angle: 10,
    },
  },
  reconnectGracePeriodMs: 30_000,
  privateRoomExpirationMs: 600_000,
} as const;

export const PENDING_ARBITRATION = {
  collisionRadius: "P-001",
  arenaOrientation: "P-002",
  arenaValidationFormula: "P-003",
  tieBreakRule: "P-004",
} as const;
