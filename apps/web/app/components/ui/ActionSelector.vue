<template>
  <div class="action-selector">
    <div class="actions">
      <button
        v-for="action in ACTIONS"
        :key="action.id"
        class="action-btn"
        :class="{ selected: selected === action.id }"
        :disabled="disabled"
        @click="$emit('select', action.id)"
      >
        <span class="action-name">{{ t(action.labelKey) }}</span>
        <span class="action-desc text-secondary">{{ action.desc }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
import { GAME_CONFIG } from "@hex-duel/shared";
import type { AttackType, PlayerAction } from "@hex-duel/shared";

export type SelectorAction = "MOVE" | AttackType;

const { t } = useI18n();

defineProps<{
  selected: SelectorAction | null;
  disabled: boolean;
}>();

defineEmits<{ select: [action: SelectorAction] }>();

const a = GAME_CONFIG.attacks;

const ACTIONS: { id: SelectorAction; labelKey: string; desc: string }[] = [
  { id: "MOVE", labelKey: "game.move", desc: `≤${GAME_CONFIG.maxMoveDistance}` },
  { id: "SWEEP", labelKey: "game.sweep", desc: `${a.SWEEP.range}/${a.SWEEP.angle}°/${a.SWEEP.damage}` },
  { id: "STRIKE", labelKey: "game.strike", desc: `${a.STRIKE.range}/${a.STRIKE.angle}°/${a.STRIKE.damage}` },
  { id: "SNIPER", labelKey: "game.sniper", desc: `${a.SNIPER.range}/${a.SNIPER.angle}°/${a.SNIPER.damage}` },
];

export type { PlayerAction };
</script>

<style scoped>
.actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-main);
  padding: 12px 16px;
  min-width: 120px;
}

.action-btn:hover:not(:disabled) {
  border-color: var(--accent);
}

.action-btn.selected {
  border-color: var(--accent);
  background-color: #2b3050;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-name {
  font-weight: 700;
  letter-spacing: 0.06em;
}

.action-desc {
  font-size: 0.8rem;
}
</style>
