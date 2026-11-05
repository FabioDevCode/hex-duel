<template>
  <div class="player-profile" :class="seatClass">
    <img class="profile-img" :src="profileSrc" alt="" draggable="false" />
    <div class="crystals">
      <img
        v-for="index in maxCrystals"
        :key="index"
        class="crystal"
        :class="{ lost: index > crystals }"
        :src="index > crystals ? brokenSrc : crystalSrc"
        alt=""
        draggable="false"
      >
    </div>
    <span class="label">{{ name }}</span>
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
// Bust + chain assets: the samurai chain extends right (top-left corner),
// the knight chain extends left (top-right corner).
const profileSrc = computed(() =>
  props.seat === 0 ? "/img/profil-samourai.png" : "/img/profil-chevalier.png",
);
const crystalSrc = computed(() =>
  props.seat === 0 ? "/img/crystal-red-hex.png" : "/img/crystal-blue-hex.png",
);
const brokenSrc = "/img/crystal-broken-hex.png";
</script>

<style scoped>
/*
 * The profile image (748x300, transparent) is a bust with a chain on the
 * bottom ~20% of its height. Displayed at 300x120, the chain band is the
 * last ~24px; the crystals hang right above it and the label sits below.
 */
.player-profile {
  position: relative;
  width: 300px;
}

.profile-img {
  display: block;
  width: 300px;
  height: 120px;
  object-fit: fill;
  pointer-events: none;
}

/* Crystals just above the chain. */
.crystals {
  position: absolute;
  bottom: 28px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
}

/* Same crystal sizing as the previous PlayerStatus. */
.crystal {
  width: auto;
  height: 42px;
  transition: opacity 0.3s, transform 0.3s;
  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.8));
}

.crystal.lost {
  opacity: 0.95;
  transform: scale(0.85);
}

/* "Vous" / "Adversaire" just below the chain. */
.label {
  display: block;
  text-align: center;
  margin-top: 2px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
</style>
