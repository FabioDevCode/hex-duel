<template>
  <div class="game-page">
    <ClientOnly>
      <GameCanvas
        :player-positions="playerPositions"
        :local-action="localAction"
        :interactive="!locked && !!selectedAction"
        :aim-locked="aimLocked"
        :my-seat="mySeat ?? 0"
        :resolution="resolution"
        @move-target="onMoveTarget"
        @attack-direction="onAttackDirection"
        @aim-locked-change="onAimLockedChange"
      />
      <GameHUD
        :turn-number="gameState?.turnNumber ?? 0"
        :deadline-at="gameState?.turnDeadlineAt ?? 0"
        :players="gameState?.players"
        :selected-action="selectedAction"
        :locked="locked"
        :opponent-ready="opponentReady"
        :my-seat="mySeat"
        @select-action="onSelectAction"
        @confirm="onConfirm"
      />
      <div v-if="finished" class="result-overlay panel">
        <h1 class="result-title">{{ resultTitle }}</h1>
        <p class="text-secondary">{{ turnsPlayed }}</p>
        <div class="result-actions">
          <button class="btn btn-primary" @click="playAgain">{{ t("result.playAgain") }}</button>
          <button class="btn" @click="backToMenu">{{ t("result.backToMenu") }}</button>
        </div>
      </div>
      <div v-else-if="waitingForOpponent" class="result-overlay panel">
        <p class="text-secondary">{{ t("room.waiting") }}</p>
        <p class="invite-code">{{ privateCode }}</p>
        <div class="result-actions">
          <button class="btn" @click="copyCode">
            {{ codeCopied ? t("room.copied") : t("room.copy") }}
          </button>
          <button class="btn" @click="cancelPrivateRoom">{{ t("matchmaking.cancel") }}</button>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { GAME_CONFIG } from "@hex-duel/shared";
import type { AttackType, PlayerAction, Vector2 } from "@hex-duel/shared";
import GameCanvas from "~/components/game/GameCanvas.vue";
import GameHUD from "~/components/game/GameHUD.vue";
import type { SelectorAction } from "~/components/ui/ActionSelector.vue";
import { useI18n } from "~/composables/useI18n";
import { useMatchmaking } from "~/composables/useMatchmaking";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { cancel } = useMatchmaking();
const { joinById, submitAction, leaveRoom, gameState, mySeat, room } = useGameRoom();

const selectedAction = ref<SelectorAction | null>(null);
const moveTarget = ref<Vector2 | null>(null);
const attackDirection = ref<number>(0);
const aimLocked = ref(false);
type ResolutionStep =
  | { kind: "move"; seat: 0 | 1; from: Vector2; to: Vector2 }
  | { kind: "attack"; seat: 0 | 1; type: AttackType; direction: number };

const resolution = ref<{ steps: ResolutionStep[] } | null>(null);
type RevealedEntry = {
  seat: 0 | 1;
  kind: "move" | "attack";
  order: number;
  type: AttackType | null;
  direction: number | null;
};
const revealedEntries = ref<RevealedEntry[]>([]);
const locked = ref(false);
const finished = ref(false);
const gameResult = ref<{ outcome: string; winnerSeat?: number } | null>(null);
const privateCode = ref<string | null>(null);
const codeCopied = ref(false);
let actionCounter = 0;

// The creator of a private room stores its invitation code before navigating
// here (room.vue); it is shown until the opponent joins.
const privateCodeKey = computed(() => {
  const roomId = route.params.id;
  return typeof roomId === "string" ? `hex-duel-private-code-${roomId}` : null;
});

const waitingForOpponent = computed(
  () =>
    privateCode.value !== null && !finished.value && (gameState.value?.players.length ?? 0) < 2,
);

const copyCode = async (): Promise<void> => {
  if (!privateCode.value) return;
  await navigator.clipboard.writeText(privateCode.value);
  codeCopied.value = true;
};

const cancelPrivateRoom = async (): Promise<void> => {
  if (privateCodeKey.value) sessionStorage.removeItem(privateCodeKey.value);
  await cancel();
  router.push("/play");
};

const playerPositions = computed<[Vector2, Vector2]>(() => {
  const players = gameState.value?.players;
  if (!players || players.length < 2) {
    return [
      { x: -6, z: 0 },
      { x: 6, z: 0 },
    ];
  }
  return [
    { x: players[0]?.x ?? -6, z: players[0]?.z ?? 0 },
    { x: players[1]?.x ?? 6, z: players[1]?.z ?? 0 },
  ];
});

const localAction = computed(() => {
  if (selectedAction.value === "MOVE" && moveTarget.value) {
    return { type: "MOVE", target: moveTarget.value };
  }
  if (selectedAction.value && selectedAction.value !== "MOVE" && selectedAction.value !== "PASS") {
    return { type: selectedAction.value, direction: attackDirection.value };
  }
  return null;
});

const opponentReady = computed(() => {
  const players = gameState.value?.players;
  if (!players || mySeat.value === null) return false;
  const opponent = players.find((p) => p.seat !== mySeat.value);
  return opponent?.hasValidated ?? false;
});

const resultTitle = computed(() => {
  if (!gameResult.value) return "";
  if (gameResult.value.outcome === "DRAW") return t("result.draw");
  if (gameResult.value.winnerSeat === mySeat.value) return t("result.victory");
  return t("result.defeat");
});

const turnsPlayed = computed(() => `${gameState.value?.turnNumber ?? 0} / ${GAME_CONFIG.maxTurns}`);

const onMoveTarget = (target: Vector2): void => {
  if (locked.value) return;
  moveTarget.value = target;
};

const onAttackDirection = (direction: number): void => {
  if (locked.value) return;
  attackDirection.value = direction;
};

const onAimLockedChange = (value: boolean): void => {
  aimLocked.value = value;
};

const onSelectAction = (action: SelectorAction): void => {
  if (locked.value) return;
  selectedAction.value = action;
  aimLocked.value = false;
  if (action === "MOVE") {
    moveTarget.value = { ...playerPositions.value[0] };
  } else if (action !== "PASS") {
    attackDirection.value = mySeat.value === 1 ? 180 : 0;
  }
};

const onConfirm = (): void => {
  if (locked.value || !selectedAction.value) return;
  let action: PlayerAction;
  if (selectedAction.value === "MOVE" && moveTarget.value) {
    action = { type: "MOVE", target: moveTarget.value };
  } else if (selectedAction.value === "PASS") {
    action = { type: "PASS" };
  } else {
    const attack: PlayerAction = {
      type: selectedAction.value as AttackType,
      direction: attackDirection.value,
    };
    action = attack;
  }
  actionCounter += 1;
  submitAction(action, `action-${actionCounter}`);
  locked.value = true;
};

type RevealedTurn = {
  actions: { seat: number; action: PlayerAction; order?: number }[];
};

type ResolvedPlayer = {
  position: Vector2;
  hp: number;
  isAlive: boolean;
};

type ResolvedTurn = {
  turnNumber: number;
  players: [ResolvedPlayer, ResolvedPlayer];
};

const onTurnRevealed = (message: RevealedTurn): void => {
  const entries: RevealedEntry[] = [];
  for (const entry of message.actions) {
    const seat: 0 | 1 = entry.seat === 0 ? 0 : 1;
    const action = entry.action;
    const order = entry.order ?? 0;
    if (action.type === "MOVE") {
      entries.push({ seat, kind: "move", order, type: null, direction: null });
    } else if (action.type !== "PASS") {
      entries.push({
        seat,
        kind: "attack",
        order,
        type: action.type,
        direction: action.direction,
      });
    }
  }
  revealedEntries.value = entries;
};

/**
 * Resolution animation order:
 * - MOVE vs MOVE: first-validated first
 * - attack vs attack: first-validated first
 * - MOVE vs attack: the move always plays first
 */
const buildResolutionSteps = (
  moveStep: (seat: 0 | 1) => ResolutionStep | null,
  entries: RevealedEntry[],
): ResolutionStep[] => {
  const bySeat = new Map(entries.map((e) => [e.seat as 0 | 1, e]));
  const ordered = [...entries].sort((a, b) => a.order - b.order);
  const first = ordered[0] ?? null;
  const second = ordered[1] ?? null;
  const steps: ResolutionStep[] = [];
  const pushFor = (entry: RevealedEntry): void => {
    if (entry.kind === "move") {
      const step = moveStep(entry.seat);
      if (step) steps.push(step);
    } else if (entry.type !== null && entry.direction !== null) {
      steps.push({
        kind: "attack",
        seat: entry.seat,
        type: entry.type,
        direction: entry.direction,
      });
    }
  };
  if (!first) return steps;
  if (!second) {
    pushFor(first);
    return steps;
  }
  // Mixed case: the move always plays first, whoever validated first.
  if (first.kind !== second.kind) {
    const moveEntry = first.kind === "move" ? first : second;
    const attackEntry = first.kind === "move" ? second : first;
    pushFor(moveEntry);
    pushFor(attackEntry);
    return steps;
  }
  // Same kinds: first-validated first.
  pushFor(first);
  pushFor(second);
  return steps;
};

const bindMessages = (): void => {
  const r = room.value;
  if (!r) return;
  r.onMessage("turn_started", () => {
    locked.value = false;
    selectedAction.value = null;
    moveTarget.value = null;
    aimLocked.value = false;
    resolution.value = null;
  });
  r.onMessage("turn_revealed", onTurnRevealed);
  r.onMessage("turn_resolved", (message: ResolvedTurn) => {
    const before = [...playerPositions.value] as [Vector2, Vector2];
    const moveStep = (seat: 0 | 1): ResolutionStep | null => {
      const resolved = message.players[seat];
      const from = before[seat];
      if (from.x !== resolved.position.x || from.z !== resolved.position.z) {
        return { kind: "move", seat, from, to: resolved.position };
      }
      return null;
    };
    resolution.value = { steps: buildResolutionSteps(moveStep, revealedEntries.value) };
    revealedEntries.value = [];
  });
  r.onMessage("game_finished", (message: { result: { outcome: string; winnerSeat?: number } }) => {
    gameResult.value = message.result;
    finished.value = true;
  });
};

const playAgain = (): void => {
  leaveRoom();
  router.push("/play");
};

const backToMenu = (): void => {
  leaveRoom();
  router.push("/");
};

onMounted(async () => {
  const roomId = route.params.id;
  if (typeof roomId === "string") {
    const storedCode = sessionStorage.getItem(`hex-duel-private-code-${roomId}`);
    if (storedCode) privateCode.value = storedCode;
    try {
      await joinById(roomId);
      bindMessages();
    } catch {
      router.push("/play");
    }
  }
});

onBeforeUnmount(() => {
  if (privateCodeKey.value) sessionStorage.removeItem(privateCodeKey.value);
  leaveRoom();
});
</script>

<style scoped>
.game-page {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.result-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 10;
}

.result-title {
  font-size: 2.5rem;
  letter-spacing: 0.15em;
}

.invite-code {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: 0.3em;
  color: var(--accent);
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
