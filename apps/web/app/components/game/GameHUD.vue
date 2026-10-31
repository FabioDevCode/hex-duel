<template>
  <div class="hud">
    <div class="hud-top panel">
      <PlayerStatus
        :name="mySeat === 0 ? t('game.you') : t('game.opponent')"
        :seat="0"
        :hp="players?.[0]?.hp ?? 0"
      />
      <div class="hud-center">
        <span class="turn">{{ t("game.turn", { turn: turnNumber, max: GAME_CONFIG.maxTurns }) }}</span>
        <TurnTimer v-if="deadlineAt > 0" :deadline-at="deadlineAt" />
      </div>
      <PlayerStatus
        :name="mySeat === 1 ? t('game.you') : t('game.opponent')"
        :seat="1"
        :hp="players?.[1]?.hp ?? 0"
      />
    </div>
    <div class="hud-bottom panel">
      <ActionSelector
        :selected="selectedAction"
        :disabled="locked"
        @select="(a) => $emit('selectAction', a)"
      />
      <button class="btn btn-primary" :disabled="locked || !selectedAction" @click="$emit('confirm')">
        {{ locked ? t("game.actionLocked") : t("game.confirm") }}
      </button>
    </div>
    <p v-if="opponentReady" class="opponent-status">{{ t("game.opponentReady") }}</p>
    <p v-else class="opponent-status text-secondary">{{ t("game.opponentChoosing") }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
import { GAME_CONFIG } from "@hex-duel/shared";
import type { AttackType, Seat } from "@hex-duel/shared";
import ActionSelector, { type SelectorAction } from "../ui/ActionSelector.vue";
import PlayerStatus from "../ui/PlayerStatus.vue";
import TurnTimer from "../ui/TurnTimer.vue";

export type HudAction = SelectorAction;

const { t } = useI18n();

defineProps<{
  turnNumber: number;
  deadlineAt: number;
  players: { seat: Seat; hp: number; isAlive: boolean; hasValidated: boolean }[] | undefined;
  selectedAction: SelectorAction | null;
  locked: boolean;
  opponentReady: boolean;
  mySeat: Seat | null;
}>();

defineEmits<{
  selectAction: [action: SelectorAction];
  confirm: [];
}>();

export type { AttackType };
</script>

<style scoped>
.hud {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
  padding: 16px;
}

.hud > * {
  pointer-events: auto;
}

.hud-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.hud-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.turn {
  font-size: 0.85rem;
  color: var(--text-secondary);
  letter-spacing: 0.08em;
}

.hud-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  align-self: center;
}

.opponent-status {
  position: absolute;
  top: 84px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  pointer-events: none;
}
</style>
