<template>
  <div class="action-selector" :class="alignClass">
    <button
      v-for="action in ACTIONS"
      :key="action.id"
      class="action-btn"
      :class="{ selected: selected === action.id }"
      :disabled="disabled"
      :title="t(action.labelKey)"
      :aria-label="t(action.labelKey)"
      @click="$emit('select', action.id)"
    >
      <img class="action-img" :src="action.img" :alt="t(action.labelKey)" draggable="false" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "~/composables/useI18n";
import type { AttackType } from "@hex-duel/shared";

export type SelectorAction = "MOVE" | AttackType;

const { t } = useI18n();

const props = defineProps<{
  selected: SelectorAction | null;
  disabled: boolean;
  /** My seat: 0 (red, left side) aligns the buttons left, 1 (blue) right. */
  mySeat?: 0 | 1 | null;
}>();

defineEmits<{ select: [action: SelectorAction] }>();

const alignClass = computed(() => ((props.mySeat ?? 0) === 0 ? "align-left" : "align-right"));

// One image asset per action (see public/img/a-*.png).
const ACTIONS: { id: SelectorAction; labelKey: string; img: string }[] = [
  { id: "MOVE", labelKey: "game.move", img: "/img/a-move.png" },
  { id: "STRIKE", labelKey: "game.strike", img: "/img/a-strike.png" },
  { id: "SNIPER", labelKey: "game.sniper", img: "/img/a-sniper.png" },
];

export type { PlayerAction } from "@hex-duel/shared";
</script>

<style scoped>
.action-selector {
  display: flex;
  gap: 10px;
}

.action-selector.align-left {
  justify-content: flex-start;
}

.action-selector.align-right {
  justify-content: flex-end;
}

/* Image-only buttons: no HTML chrome around the assets. */
.action-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.action-btn.selected {
  transform: scale(1.08);
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.65));
}

.action-img {
  width: 84px;
  height: 84px;
  object-fit: contain;
  display: block;
  pointer-events: none;
}
</style>
