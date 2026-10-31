<template>
  <div class="home">
    <h1 class="title">HEX DUEL</h1>
    <p class="tagline">{{ t("home.tagline") }}</p>
    <NuxtLink to="/play" class="btn btn-primary play-btn">{{ t("home.play") }}</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
const { t } = useI18n();
</script>

<style scoped>
.home {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.title {
  font-size: 3.5rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: var(--accent);
}

.tagline {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.play-btn {
  font-size: 1.2rem;
  padding: 16px 64px;
  margin-top: 16px;
}
</style>
