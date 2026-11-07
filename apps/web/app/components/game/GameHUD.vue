<template>
  <div class="hud">
    <div class="hud-top panel">
      <!-- Corner profiles: bust + chain, crystals above the chain,
           "Vous"/"Adversaire" below. Hidden once the game is over. -->
      <PlayerProfile
        v-if="!finished"
        :name="seatName(0)"
        :seat="0"
        :crystals="players?.[0]?.crystals ?? 0"
      />
      <div v-if="!finished" class="hud-center">
        <span class="turn">{{ t("game.turn", { turn: turnNumber, max: GAME_CONFIG.maxTurns }) }}</span>
        <TurnTimer v-if="deadlineAt > 0" :deadline-at="deadlineAt" />
      </div>
      <PlayerProfile
        v-if="!finished"
        :name="seatName(1)"
        :seat="1"
        :crystals="players?.[1]?.crystals ?? 0"
      />
    </div>
    <div class="hud-bottom panel" :class="(mySeat ?? 0) === 0 ? 'side-left' : 'side-right'">
      <ActionSelector
        :selected="selectedAction"
        :disabled="locked"
        :my-seat="mySeat"
        @select="(a) => $emit('selectAction', a)"
      />
      <button
        class="img-btn"
        :disabled="locked || !selectedAction"
        :title="locked ? t('game.actionLocked') : t('game.confirm')"
        :aria-label="t('game.confirm')"
        @click="$emit('confirm')"
      >
        <img src="/img/a-validate.png" :alt="t('game.confirm')" draggable="false" />
      </button>
      <button
        class="img-btn"
        :title="t('surrender.title')"
        :aria-label="t('surrender.title')"
        @click="surrenderOpen = true"
      >
        <img src="/img/a-giveup.png" :alt="t('surrender.title')" draggable="false" />
      </button>
    </div>

    <div v-if="surrenderOpen" class="modal-backdrop" @click.self="surrenderOpen = false">
      <div class="modal panel">
        <img class="modal-img" src="/img/i-giveup.png" alt="Give Up">
        <h2 class="modal-title">{{ t("surrender.title") }}</h2>
        <p class="modal-text">{{ t("surrender.text") }}</p>
        <div class="modal-actions">
          <button class="btn back-btn" @click="surrenderOpen = false">{{ t("surrender.cancel") }}</button>
          <button class="btn btn-primary" @click="$emit('surrender'); surrenderOpen = false">
            {{ t("surrender.confirm") }}
          </button>
        </div>
      </div>
    </div>
    <template v-if="!finished">
      <!-- <p v-if="opponentReady" class="opponent-status">{{ t("game.opponentReady") }}</p> -->
      <!-- <p v-else class="opponent-status text-tertiaire">{{ t("game.opponentChoosing") }}</p> -->
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
import { GAME_CONFIG } from "@hex-duel/shared";
import type { AttackType, Seat } from "@hex-duel/shared";
import ActionSelector, { type SelectorAction } from "../ui/ActionSelector.vue";
import PlayerProfile from "../ui/PlayerProfile.vue";
import TurnTimer from "../ui/TurnTimer.vue";

export type HudAction = SelectorAction;

const { t } = useI18n();

const props = defineProps<{
  turnNumber: number;
  deadlineAt: number;
  players: {
    seat: Seat;
    pseudonym?: string;
    crystals: number;
    isAlive: boolean;
    hasValidated: boolean;
  }[] | undefined;
  selectedAction: SelectorAction | null;
  locked: boolean;
  opponentReady: boolean;
  /** Game over: the turn counter, timer and status texts are hidden. */
  finished: boolean;
  mySeat: Seat | null;
}>();

// Display pseudonym of the seat (D-142/143), with a "you" marker on my own
// side; falls back to the generic label while the state is not synced yet.
const seatName = (seat: 0 | 1): string => {
  const pseudonym = props.players?.[seat]?.pseudonym;
  const mine = seat === (props.mySeat ?? 0);
  const base = pseudonym || t(mine ? "game.you" : "game.opponent");
  return mine ? `${base} (${t("game.you")})` : base;
};

defineEmits<{
  selectAction: [action: SelectorAction];
  confirm: [];
  surrender: [];
}>();

const surrenderOpen = ref(false);

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
  padding: 8px;
}

.hud > * {
  pointer-events: auto;
}

.hud-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background-color: transparent;
  border: 0px solid transparent;
  padding: 0px 4px;
}

.hud-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.turn {
  font-size: 0.85rem;
  color: var(--text-tertiaire);
  letter-spacing: 0.08em;
  font-weight: 600;
}

.hud-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
  align-self: center;
  background-color: transparent;
  padding: 8px 0px;
  border: 0px solid transparent;
}

/* My buttons sit on my side of the arena: red (seat 0) on the
   left, blue (seat 1) on the right. */
.hud-bottom.side-left {
  justify-content: flex-start;
}

.hud-bottom.side-right {
  justify-content: flex-end;
}

/* Image-only buttons: no HTML chrome around the assets. */
.img-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.img-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.img-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.img-btn img {
  width: 68px;
  height: 68px;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.surrender-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  background-color: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-main);
  transition: border-color 0.15s;
}

.surrender-btn:hover {
  border-color: var(--error);
}

.flag-icon {
  width: 20px;
  height: 20px;
  color: #ffffff;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  min-width: 320px;
  text-align: center;
}

.modal-img {
  width: 180px;
}

.modal-title {
  font-size: 1.2rem;
  letter-spacing: 0.1em;
}

.modal-text {
  color: var(--text-secondary);
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.btn-danger {
  background-color: var(--error);
  border-color: var(--error);
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  background-color: #d94a52;
}

.opponent-status {
  position: absolute;
  top: 84px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  pointer-events: none;
  font-weight: 600;
}
</style>
