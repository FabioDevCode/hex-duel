export const GAME_CONFIG = {
  maxHp: 100,
  turnDurationMs: 30_000,
  maxTurns: 30,
  arenaRadius: 12,
  maxMoveDistance: 3,
  collisionRadius: 0,
  attacks: {
    SWEEP: {
      range: 2,
      angle: 180,
      damage: 25,
    },
    STRIKE: {
      range: 5,
      angle: 90,
      damage: 30,
    },
    SNIPER: {
      range: 12,
      angle: 10,
      damage: 40,
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
