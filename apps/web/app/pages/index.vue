<template>
  <div class="home">
    <img src="/img/hex-duel-logo-sm.png" alt="HEX DUEL">
    <!-- <p class="tagline">{{ t("home.tagline") }}</p> -->
    <NuxtLink to="/play" class="btn play-btn golden-button">
      {{ t("home.play") }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
const { t } = useI18n();

definePageMeta({ layout: "main" });
</script>

<style scoped>
.home {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

img {
  max-width: 600px;
  width: 100%;
  filter: drop-shadow(5px 8px 10px rgba(0, 0, 0, 0.4));
}

.title {
  font-size: 3.5rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.tagline {
  text-align: center;
  color: var(--text-secondary);
  font-size: 1.4rem;
  font-weight: 500;
}

.play-btn {
  font-size: 1.2rem;
  padding: 16px 64px;
  margin-top: 16px;
  text-decoration: none;
}
</style>
