<template>
  <div class="game-page">
    <ClientOnly>
      <GameCanvas
        :player-positions="playerPositions"
        :local-action="localAction"
        :interactive="!locked && !!selectedAction"
        @move-target="onMoveTarget"
        @attack-direction="onAttackDirection"
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
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { GAME_CONFIG } from "@hex-duel/shared";
import type { AttackType, PlayerAction, Vector2 } from "@hex-duel/shared";
import GameCanvas from "~/components/game/GameCanvas.vue";
import GameHUD from "~/components/game/GameHUD.vue";
import type { SelectorAction } from "~/components/ui/ActionSelector.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { joinById, submitAction, leaveRoom, gameState, mySeat, room } = useGameRoom();

const selectedAction = ref<SelectorAction | null>(null);
const moveTarget = ref<Vector2 | null>(null);
const attackDirection = ref<number>(0);
const locked = ref(false);
const finished = ref(false);
const gameResult = ref<{ outcome: string; winnerSeat?: number } | null>(null);
let actionCounter = 0;

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

const onSelectAction = (action: SelectorAction): void => {
  if (locked.value) return;
  selectedAction.value = action;
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

const bindMessages = (): void => {
  const r = room.value;
  if (!r) return;
  r.onMessage("turn_started", () => {
    locked.value = false;
    selectedAction.value = null;
    moveTarget.value = null;
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
    try {
      await joinById(roomId);
      bindMessages();
    } catch {
      router.push("/play");
    }
  }
});

onBeforeUnmount(() => {
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

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
