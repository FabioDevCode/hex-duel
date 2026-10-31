<template>
  <div class="player-status" :class="seatClass">
    <span class="name">{{ name }}</span>
    <div class="hp-bar">
      <div class="hp-fill" :style="{ width: `${hpPercent}%` }" />
    </div>
    <span class="hp-value">{{ hp }}</span>
  </div>
</template>

<script setup lang="ts">
import { GAME_CONFIG } from "@hex-duel/shared";

const props = defineProps<{
  name: string;
  seat: 0 | 1;
  hp: number;
}>();

const seatClass = computed(() => (props.seat === 0 ? "seat-0" : "seat-1"));
const hpPercent = computed(() =>
  Math.max(0, Math.min(100, (props.hp / GAME_CONFIG.maxHp) * 100)),
);
</script>

<style scoped>
.player-status {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.name {
  font-weight: 600;
  width: 90px;
}

.hp-bar {
  flex: 1;
  height: 10px;
  background-color: var(--bg-main);
  border: 1px solid var(--border);
  border-radius: 5px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  transition: width 0.3s;
}

.seat-0 .hp-fill {
  background-color: var(--player-red);
}

.seat-1 .hp-fill {
  background-color: var(--player-blue);
}

.hp-value {
  width: 32px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
