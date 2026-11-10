<template>
  <div class="home">
    <img src="/img/hex-duel-logo.png" alt="HEX DUEL">
    <!-- <p class="tagline">{{ t("home.tagline") }}</p> -->
    <NuxtLink to="/play" class="btn play-btn golden-button">
      {{ t("home.play") }}
    </NuxtLink>
    <button class="btn second-btn golden-button" @click="howToOpen = true">
      {{ t("howto.title") }}
    </button>
    <HowToPlayModal v-if="howToOpen" @close="howToOpen = false" />
    <button class="btn second-btn golden-button" @click="creditsOpen = true">
      {{ t("home.credits") }}
    </button>
    <CreditsOverlay :visible="creditsOpen" @close="creditsOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
import HowToPlayModal from "~/components/ui/HowToPlayModal.vue";
import CreditsOverlay from "~/components/ui/CreditsOverlay.vue";

const { t } = useI18n();
const howToOpen = ref(false);
const creditsOpen = ref(false);

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
  max-width: 500px;
  width: 100%;
  overflow: visible;
  filter: drop-shadow(2px 6px 16px rgba(0, 0, 0, 0.9));
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
  border-radius: 12px;
  width: 240px;
  text-decoration: none;
  corner-shape: bevel;
}

.second-btn {
  font-size: 0.9rem;
  padding: 18px 8px;
  margin-top: 16px;
  border-radius: 12px;
  width: 240px;
  text-decoration: none;
  corner-shape: bevel;
}
</style>
