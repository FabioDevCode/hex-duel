<template>
  <div class="player-status" :class="seatClass">
    <span class="name">{{ name }}</span>
    <div class="crystals">
      <svg
        v-for="index in maxCrystals"
        :key="index"
        class="crystal"
        :class="{ lost: index > crystals }"
        viewBox="0 0 24 32"
        aria-hidden="true"
      >
        <path d="M12 1 L23 16 L12 31 L1 16 Z" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { GAME_CONFIG } from "@hex-duel/shared";

const props = defineProps<{
  name: string;
  seat: 0 | 1;
  crystals: number;
}>();

const maxCrystals = GAME_CONFIG.maxCrystals;
const seatClass = computed(() => (props.seat === 0 ? "seat-0" : "seat-1"));
</script>

<style scoped>
.player-status {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.player-status.seat-0 {
  justify-content: start;
}

.player-status.seat-1 {
  justify-content: end;
}

.name {
  font-weight: 600;
  width: 90px;
}

.crystals {
  display: flex;
  gap: 8px;
}

.crystal {
  width: 18px;
  height: 24px;
  transition: opacity 0.3s, transform 0.3s;
  filter: drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.8));
}

.seat-0 .crystal path {
  fill: var(--player-red);

}

.seat-1 .crystal path {
  fill: var(--player-blue);

}

.crystal.lost {
  opacity: 0.95;
  transform: scale(0.85);
}

.crystal.lost path {
  fill: var(--crystal-lost);
}
</style>
