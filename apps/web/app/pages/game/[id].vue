<template>
  <div class="game-page">
    <div class="game-bg" aria-hidden="true" />
    <ClientOnly>
      <GameCanvas
        :player-positions="playerPositions"
        :local-action="localAction"
        :interactive="!locked && !!selectedAction"
        :aim-locked="aimLocked"
        :my-seat="mySeat ?? 0"
        :resolution="resolution"
        :interrupt="interruptResolution"
        :fatal-attacker-seat="fatalAttackerSeat"
        :bonuses="displayedBonuses"
        :current-turn="gameState?.turnNumber ?? 0"
        :armed-bonus="gameState?.players?.[mySeat ?? 0]?.armedBonus ?? null"
        :pending-pickups="pendingPickups"
        @move-target="onMoveTarget"
        @attack-direction="onAttackDirection"
        @aim-locked-change="onAimLockedChange"
        @hit-landed="onHitLanded"
        @resolution-end="onResolutionEnd"
      />
      <GameHUD
        :turn-number="gameState?.turnNumber ?? 0"
        :deadline-at="gameState?.turnDeadlineAt ?? 0"
        :players="displayedPlayers"
        :regen-crystal-index="regenCrystalIndex"
        :selected-action="selectedAction"
        :locked="locked"
        :opponent-ready="opponentReady"
        :finished="finished"
        :my-seat="mySeat"
        @select-action="onSelectAction"
        @confirm="onConfirm"
        @surrender="onSurrender"
      />
      <p v-if="submitError" class="submit-error">{{ submitError }}</p>
      <div v-if="finished" class="result-backdrop">
        <div class="result-modal panel">
          <img
            v-if="resultImage"
            class="result-img"
            :src="resultImage"
            :alt="resultTitle"
            draggable="false"
          >
          <h1 class="result-title">{{ resultTitle }}</h1>
          <p class="result-players">{{ resultPlayers }}</p>
          <p class="text-secondary">{{ turnsPlayed }}</p>
          <div class="result-actions">
            <button class="btn btn-primary" @click="playAgain">{{ t("result.playAgain") }}</button>
            <button class="btn back-btn" @click="backToMenu">{{ t("result.backToMenu") }}</button>
          </div>
        </div>
      </div>
      <div v-else-if="waitingForOpponent" class="result-backdrop">
        <div class="result-modal panel">
          <p class="text-secondary">{{ t("room.waiting") }}</p>
          <p class="invite-code">{{ privateCode }}</p>
          <div class="result-actions">
            <button class="btn btn-primary" @click="copyCode">
              {{ codeCopied ? t("room.copied") : t("room.copy") }}
            </button>
            <button class="btn back-btn" @click="cancelPrivateRoom">{{ t("matchmaking.cancel") }}</button>
          </div>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { GAME_CONFIG } from "@hex-duel/shared";
import type { AttackType, BonusEvents, BonusType, GroundBonus, PlayerAction, Vector2 } from "@hex-duel/shared";
import GameCanvas from "~/components/game/GameCanvas.vue";
import GameHUD from "~/components/game/GameHUD.vue";
import type { SelectorAction } from "~/components/ui/ActionSelector.vue";
import { useI18n } from "~/composables/useI18n";
import { useMatchmaking } from "~/composables/useMatchmaking";

definePageMeta({ layout: "game" });

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { cancel } = useMatchmaking();
const { joinById, submitAction, surrender, leaveRoom, gameState, mySeat, room } = useGameRoom();

const selectedAction = ref<SelectorAction | null>(null);
const moveTarget = ref<Vector2 | null>(null);
const attackDirection = ref<number>(0);
const aimLocked = ref(false);
type ResolutionStep =
  | { kind: "move"; seat: 0 | 1; from: Vector2; to: Vector2 }
  | { kind: "attack"; seat: 0 | 1; type: AttackType; direction: number; hit: boolean };

const resolution = ref<{ steps: ResolutionStep[] } | null>(null);
// True when the current resolution is the fatal one (a player lost their
// last crystal): the remaining steps are cancelled, nothing animates
// behind the victory/defeat overlay.
const interruptResolution = ref(false);
// Seat of the attack that ended the game (the last resolved attack): the
// client plays the resolution up to and including that attack, so the
// fatal blow is always shown - even when it is the second attack.
const fatalAttackerSeat = ref<0 | 1 | null>(null);
// Index (1-based) of the crystal restored by a regeneration, per seat: it
// displays as the green crystal until destroyed again.
const regenCrystalIndex = ref<[number | null, number | null]>([null, null]);
// Bonuses picked up in the current resolution: the canvas keeps them
// visible until the slash or the moving character reaches them.
const pendingPickups = ref<BonusEvents["pickups"]>([]);
// Armed bonus held during the resolution animation: the icon only
// appears once the pickup is actually visible (resolutionEnd), not the
// moment the server state syncs.
const armedHold = ref<[BonusType | null, BonusType | null]>([null, null]);
const armedBeforeTurn = ref<[BonusType | null, BonusType | null]>([null, null]);
/** True while the resolution plays: the armed icons are frozen. */
const armedHoldActive = ref(false);
// Ground bonuses held during the resolution: a bonus spawned by this
// resolution only appears when the next turn begins (resolutionEnd),
// never in the middle of the animations.
const groundHold = ref<GroundBonus[] | null>(null);
const groundBeforeTurn = ref<GroundBonus[]>([]);
// Crystals displayed in the HUD: during the resolution animation the
// server state is already patched, so we hold the pre-attack values and
// only let a crystal break when the attack animation actually lands.
const crystalsBeforeTurn = ref<[number, number] | null>(null);
const crystalsHold = ref<[number, number] | null>(null);
type RevealedEntry = {
  seat: 0 | 1;
  kind: "move" | "attack";
  order: number;
  type: AttackType | null;
  direction: number | null;
};
const revealedEntries = ref<RevealedEntry[]>([]);
const positionsBeforeTurn = ref<[Vector2, Vector2] | null>(null);
const locked = ref(false);
const finished = ref(false);
const gameResult = ref<{ outcome: string; winnerSeat?: number } | null>(null);
const submitError = ref<string | null>(null);
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

// Ground bonuses as displayed: held during the resolution - the new
// spawns appear only when the animations are over.
const displayedBonuses = computed<GroundBonus[]>(() =>
  groundHold.value ?? gameState.value?.bonuses ?? [],
);

// Players as displayed: crystals are held during the resolution animation
// and released seat by seat when the attack animations land (or all at
// once when the resolution ends).
const displayedPlayers = computed(() => {
  const players = gameState.value?.players;
  if (!players) return players;
  const hold = crystalsHold.value;
  const armed = (index: 0 | 1, synced: BonusType | null): BonusType | null =>
    armedHoldActive.value ? (armedHold.value[index] ?? null) : synced;
  if (!hold) {
    return players.map((player, index) => ({
      ...player,
      armedBonus: armed(index as 0 | 1, player.armedBonus),
    }));
  }
  return players.map((player, index) => ({
    ...player,
    crystals: hold[index as 0 | 1] ?? player.crystals,
    armedBonus: armed(index as 0 | 1, player.armedBonus),
  }));
});

/** A crystal breaks at the end of the attacker's animation. */
const onHitLanded = (targetSeat: 0 | 1): void => {
  const hold = crystalsHold.value;
  if (!hold) return;
  const after = gameState.value?.players?.[targetSeat]?.crystals;
  if (after === undefined) return;
  crystalsHold.value = [
    targetSeat === 0 ? after : hold[0],
    targetSeat === 1 ? after : hold[1],
  ];
};

/** Resolution sequence over: display the authoritative crystals again. */
const onResolutionEnd = (): void => {
  crystalsHold.value = null;
  pendingPickups.value = [];
  // Release the armed icons: the pickups are now visible on screen.
  armedHoldActive.value = false;
  // Release the ground bonuses: the new spawns appear now, at the start
  // of the next turn.
  groundHold.value = null;
  groundBeforeTurn.value = gameState.value?.bonuses ?? [];
  const players = gameState.value?.players;
  armedBeforeTurn.value = [players?.[0]?.armedBonus ?? null, players?.[1]?.armedBonus ?? null];
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
  if (selectedAction.value && selectedAction.value !== "MOVE") {
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

// Both players' pseudonyms on the result screen (D-142/143).
const resultPlayers = computed(() => {
  const players = gameState.value?.players;
  const red = players?.[0]?.pseudonym ?? t("game.opponent");
  const blue = players?.[1]?.pseudonym ?? t("game.opponent");
  return `${red}  vs  ${blue}`;
});

// Victory/defeat illustration (see public/img/i-*.png); no image on a draw.
const resultImage = computed(() => {
  if (!gameResult.value) return null;
  if (gameResult.value.outcome === "DRAW") return null;
  return gameResult.value.winnerSeat === mySeat.value ? "/img/i-victory.png" : "/img/i-defeat.png";
});

const onMoveTarget = (target: Vector2): void => {
  if (locked.value) return;
  moveTarget.value = target;
};

const onAttackDirection = (direction: number): void => {
  if (locked.value) return;
  attackDirection.value = direction;
};

const onSurrender = (): void => {
  if (finished.value) return;
  surrender();
};

const onAimLockedChange = (value: boolean): void => {
  aimLocked.value = value;
};

const onSelectAction = (action: SelectorAction): void => {
  if (locked.value) return;
  selectedAction.value = action;
  aimLocked.value = false;
  submitError.value = null;
  if (action === "MOVE") {
    moveTarget.value = { ...playerPositions.value[mySeat.value ?? 0] };
  } else {
    attackDirection.value = mySeat.value === 1 ? 180 : 0;
  }
};

const onConfirm = (): void => {
  if (locked.value || !selectedAction.value) return;
  submitError.value = null;
  let action: PlayerAction;
  if (selectedAction.value === "MOVE" && moveTarget.value) {
    action = { type: "MOVE", target: moveTarget.value };
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
  crystals: number;
  isAlive: boolean;
};

type ResolvedAttack = {
  attackerSeat: number;
  targetSeat: number;
  attackType: AttackType;
  hits: boolean;
};

type ResolvedTurn = {
  turnNumber: number;
  players: [ResolvedPlayer, ResolvedPlayer];
  attacks?: ResolvedAttack[];
  bonusEvents?: BonusEvents | null;
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
  // The state patch for this turn has not been applied yet at reveal time,
  // so the synced positions still hold this turn's starting positions.
  positionsBeforeTurn.value = [...playerPositions.value] as [Vector2, Vector2];
  crystalsBeforeTurn.value = [
    gameState.value?.players?.[0]?.crystals ?? 3,
    gameState.value?.players?.[1]?.crystals ?? 3,
  ];
};

/**
 * Resolution animation order:
 * - MOVE vs MOVE: first-validated first
 * - attack vs attack: first-validated first
 * - MOVE vs attack: the move always plays first
 */
/** Whether the seat's attack of this type landed (server outcome). */
const attackHits = (
  attacks: ResolvedAttack[] | undefined,
  seat: 0 | 1,
  type: AttackType,
): boolean =>
  attacks?.find((a) => a.attackerSeat === seat && a.attackType === type)?.hits ?? false;

const buildResolutionSteps = (
  moveStep: (seat: 0 | 1) => ResolutionStep | null,
  entries: RevealedEntry[],
  attacks: ResolvedAttack[] | undefined,
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
        hit: attackHits(attacks, entry.seat, entry.type),
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
    submitError.value = null;
  });
  r.onMessage("turn_revealed", onTurnRevealed);
  r.onMessage("server_error", (message: { code: string; message: string }) => {
    // A rejected submission must never leave the player locked out.
    locked.value = false;
    aimLocked.value = false;
    submitError.value = message.message;
  });
  r.onMessage("turn_resolved", (message: ResolvedTurn) => {
    const before = positionsBeforeTurn.value ?? ([...playerPositions.value] as [Vector2, Vector2]);
    positionsBeforeTurn.value = null;
    // Hold the pre-attack crystals until the attack animation lands.
    crystalsHold.value = crystalsBeforeTurn.value ?? [
      message.players[0].crystals,
      message.players[1].crystals,
    ];
    crystalsBeforeTurn.value = null;
    const moveStep = (seat: 0 | 1): ResolutionStep | null => {
      const resolved = message.players[seat];
      const from = before[seat];
      if (from.x !== resolved.position.x || from.z !== resolved.position.z) {
        return { kind: "move", seat, from, to: resolved.position };
      }
      return null;
    };
    interruptResolution.value = message.players.some(
      (player) => !player.isAlive || player.crystals <= 0,
    );
    // The server stops resolving right after the kill: the fatal attack is
    // the last one in the list.
    const lastAttack = message.attacks?.[message.attacks.length - 1];
    fatalAttackerSeat.value = interruptResolution.value
      ? ((lastAttack?.attackerSeat ?? null) as 0 | 1 | null)
      : null;
    pendingPickups.value = message.bonusEvents?.pickups ?? [];
    // Hold the armed bonuses as they were BEFORE this resolution: the
    // icons must not change until the animation shows the pickup.
    armedHold.value = armedBeforeTurn.value;
    armedHoldActive.value = true;
    groundHold.value = groundBeforeTurn.value;
    // Regeneration: the restored crystal displays as green (UI_UX 30.3);
    // a crystal loss clears the green marker if that crystal is gone.
    for (const regen of message.bonusEvents?.regen ?? []) {
      regenCrystalIndex.value[regen.seat] = regen.crystalsAfter;
    }
    for (const seat of [0, 1] as const) {
      const crystals = message.players[seat]?.crystals ?? 3;
      const greenIndex = regenCrystalIndex.value[seat];
      if (greenIndex !== null && crystals < greenIndex) {
        regenCrystalIndex.value[seat] = null;
      }
    }
    resolution.value = {
      steps: buildResolutionSteps(moveStep, revealedEntries.value, message.attacks),
    };
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

.game-bg {
  position: absolute;
  inset: 0;
  background: url("/img/terrain-combat.png") center / cover no-repeat;
  z-index: 0;
  pointer-events: none;
}

.submit-error {
  position: absolute;
  bottom: 110px;
  left: 50%;
  transform: translateX(-50%);
  color: var(--error);
  font-size: 0.9rem;
  background: var(--bg-panel);
  border: 1px solid var(--error);
  border-radius: 6px;
  padding: 8px 16px;
  z-index: 5;
}

.result-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.result-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 320px;
}

.result-img {
  width: 220px;
}

.result-players {
  font-weight: 600;
  letter-spacing: 0.04em;
}


.result-title {
  font-size: 2.5rem;
  letter-spacing: 0.15em;
}

.invite-code {
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;

  background: linear-gradient(
    135deg,
    #CB5901,
    #FD9909,
    #FCF069,
    #FD9909,
    #CB5901
  );
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.result-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  justify-content: center;
}
</style>
