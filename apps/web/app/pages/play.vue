<template>
  <div class="play">
    <NuxtLink to="/matchmaking" class="mode-card">
      <h2>{{ t("play.quickMatch") }}</h2>
      <p class="text-secondary">{{ t("play.quickMatchDesc") }}</p>
    </NuxtLink>
    <NuxtLink to="/room" class="mode-card">
      <h2>{{ t("play.privateRoom") }}</h2>
      <p class="text-secondary">{{ t("play.privateRoomDesc") }}</p>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
const { t } = useI18n();
</script>

<style scoped>
.play {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 32px;
}

.mode-card {
  background-color: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 48px 40px;
  width: 320px;
  text-decoration: none;
  color: var(--text-main);
  text-align: center;
  transition: border-color 0.15s;
}

.mode-card:hover {
  border-color: var(--accent);
}

.mode-card h2 {
  margin-bottom: 12px;
  letter-spacing: 0.08em;
}
</style>
