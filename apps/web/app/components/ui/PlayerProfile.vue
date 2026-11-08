<template>
  <div class="player-profile" :class="seatClass">
    <img class="profile-img" :src="profileSrc" alt="" draggable="false" />
    <div class="crystals">
      <img
        v-for="index in maxCrystals"
        :key="index"
        class="crystal"
        :class="{ lost: index > crystals }"
        :src="crystalSrcFor(index)"
        alt=""
        draggable="false"
      >
    </div>
    <span class="label">{{ name }}</span>
    <!-- Armed bonus icon, visible to both players (UI_UX 30.2). -->
    <img
      v-if="armedBonus"
      class="armed-bonus"
      :src="armedBonusSrc"
      :alt="t(`bonus.${armedBonus}`)"
      :title="t(`bonus.${armedBonus}`)"
      draggable="false"
    >
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { GAME_CONFIG } from "@hex-duel/shared";
import type { BonusType } from "@hex-duel/shared";
import { useI18n } from "~/composables/useI18n";

const props = defineProps<{
  name: string;
  seat: 0 | 1;
  crystals: number;
  /** Bonus armed by this player (REGEN never shows: immediate effect). */
  armedBonus?: BonusType | null;
  /** 1-based index of the crystal restored by a regeneration (green). */
  regenIndex?: number | null;
}>();

const { t } = useI18n();

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
const greenSrc = "/img/crystal-green-hex.png";

/** Broken when lost, green for the regenerated one, seat color otherwise. */
const crystalSrcFor = (index: number): string => {
  if (index > props.crystals) return brokenSrc;
  if (index === props.regenIndex) return greenSrc;
  return crystalSrc.value;
};

const armedBonusSrc = computed(() => {
  if (props.armedBonus === "ATTACK") return "/img/bonus-atk.png";
  if (props.armedBonus === "MOVE") return "/img/bonus-move.png";
  if (props.armedBonus === "SHIELD") return "/img/bonus-shield.png";
  return "/img/bonus-crystal.png";
});
</script>

<style scoped>
/*
 * The profile image (748x300, transparent) is a bust with a chain on the
 * bottom ~20% of its height. Displayed at 300x120, the chain band is the
 * last ~24px; the crystals hang right above it and the label sits below.
 */
.player-profile {
  position: relative;
  width: max-content;
}

.profile-img {
  display: block;
  height: 80px;
  object-fit: fill;
  pointer-events: none;
  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.6));
}

/* Crystals just above the chain. */
.crystals {
  position: absolute;
  bottom: 36px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.seat-0 .crystals {
  justify-content: end;
}

.seat-0 span {
  text-align: left;
  padding-left: 12px;
}

.seat-1 .crystals {
  justify-content: start;
}

.seat-1 span {
  text-align: right;
  padding-right: 12px;
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
  transform: scale(0.95);
}

/* "Vous" / "Adversaire" just below the chain. */
.label {
  display: block;
  text-align: center;
  margin-top: 2px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

/*
 * Armed bonus badge (UI_UX 30.2): absolutely positioned over the lower
 * chain band, right under the crystals - it floats on the profile without
 * affecting the layout flow (no shift of the name or the crystals).
 */
.armed-bonus {
  position: absolute;
  top: 104px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 30px;
  object-fit: contain;
  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.9));
  pointer-events: none;
}
</style>
