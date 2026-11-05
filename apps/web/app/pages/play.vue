<template>
  <div class="play">
    <NuxtLink to="/matchmaking" class="mode-card golden-btn">
      <h2>{{ t("play.quickMatch") }}</h2>
      <p class="text-secondary">{{ t("play.quickMatchDesc") }}</p>
    </NuxtLink>

    <NuxtLink to="/room" class="mode-card golden-btn">
      <h2>{{ t("play.privateRoom") }}</h2>
      <p class="text-secondary">{{ t("play.privateRoomDesc") }}</p>
    </NuxtLink>

    <hr class="separator">

    <NuxtLink to="/" class="btn back-btn">
      {{ t("result.backToMenu") }}
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
  flex-direction: column;
  gap: 24px;
  padding: 32px;
}

.mode-card {
  padding: 20px 40px;
  width: 320px;
  flex-direction: column;
  text-decoration: none;
  text-align: center;
}

.separator {
  width: 320px;
}

.mode-card h2 {
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.mode-card p {
  text-transform: lowercase;
  font-weight: 400;
  word-break: normal;
  font-size: 0.8em;
  color: #CB5901;
}

.golden-btn {
  box-sizing: border-box;
  touch-action: manipulation;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  outline: none;
  font-family: "Noto Sans", Verdana, sans-serif;
  max-width: 500px;
  min-width: 300px;
  font-size: 1em;
  border-radius: 20px;
  corner-shape: bevel;
  height: max-content;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(110, 80, 20, 0.4),
      inset 0 -2px 5px 1px rgba(203, 89, 1, 1),
      inset 0 -1px 1px 3px rgba(250, 227, 133, 1);

  background-image: linear-gradient(
      160deg,
      #CB5901,
      #FD9909,
      #FCF069,
      #FD9909,
      #CB5901
  );
  border: 2px solid #170E1A;
  color: #ac4a00;
  font-weight: 600;
  text-shadow: 0 1px 1px #FCF069;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-size: 100% 100%;
  background-position: center;
}
</style>
