<template>
  <div class="howto-backdrop" @click.self="emit('close')">
    <div class="howto-modal" role="dialog" :aria-label="t('howto.title')">
      <button class="howto-close" :aria-label="t('howto.close')" @click="emit('close')">&times;</button>
      <div class="howto-scroll">
        <h1 class="howto-heading">{{ t("howto.title") }}</h1>

        <!-- Concept -->
        <p class="howto-text">{{ t("howto.concept") }}</p>

        <!-- Turns -->
        <h2 class="howto-heading">{{ t("howto.turnsTitle") }}</h2>
        <p class="howto-text">{{ t("howto.turns") }}</p>

        <!-- Actions -->
        <h2 class="howto-heading">{{ t("howto.actionsTitle") }}</h2>
        <div class="howto-grid">
          <div class="howto-entry">
            <img src="/img/a-move.png" alt="" draggable="false">
            <div>
              <strong>{{ t("howto.moveTitle") }}</strong>
              <p class="howto-text">{{ t("howto.move") }}</p>
            </div>
          </div>
          <div class="howto-entry">
            <img src="/img/a-strike.png" alt="" draggable="false">
            <div>
              <strong>{{ t("howto.strikeTitle") }}</strong>
              <p class="howto-text">{{ t("howto.strike") }}</p>
            </div>
          </div>
          <div class="howto-entry">
            <img src="/img/a-sniper.png" alt="" draggable="false">
            <div>
              <strong>{{ t("howto.sniperTitle") }}</strong>
              <p class="howto-text">{{ t("howto.sniper") }}</p>
            </div>
          </div>
          <div class="howto-entry">
            <img src="/img/a-giveup.png" alt="" draggable="false">
            <div>
              <strong>{{ t("howto.giveupTitle") }}</strong>
              <p class="howto-text">{{ t("howto.giveup") }}</p>
            </div>
          </div>
        </div>

        <!-- Crystals -->
        <h2 class="howto-heading">{{ t("howto.crystalsTitle") }}</h2>
        <div class="howto-crystals">
          <img src="/img/crystal-red-hex.png" alt="" draggable="false">
          <img src="/img/crystal-blue-hex.png" alt="" draggable="false">
          <img src="/img/crystal-broken-hex.png" alt="" draggable="false">
          <img src="/img/crystal-green-hex.png" alt="" draggable="false">
        </div>
        <p class="howto-text">{{ t("howto.crystals") }}</p>

        <!-- Bonuses -->
        <h2 class="howto-heading">{{ t("howto.bonusTitle") }}</h2>
        <p class="howto-text">{{ t("howto.bonusIntro") }}</p>
        <div class="howto-grid">
          <div class="howto-entry">
            <img src="/img/bonus-crystal.png" alt="" draggable="false">
            <div>
              <strong>{{ t("bonus.REGEN") }}</strong>
              <p class="howto-text">{{ t("howto.bonus.regen") }}</p>
            </div>
          </div>
          <div class="howto-entry">
            <img src="/img/bonus-atk.png" alt="" draggable="false">
            <div>
              <strong>{{ t("bonus.ATTACK") }}</strong>
              <p class="howto-text">{{ t("howto.bonus.attack") }}</p>
            </div>
          </div>
          <div class="howto-entry">
            <img src="/img/bonus-move.png" alt="" draggable="false">
            <div>
              <strong>{{ t("bonus.MOVE") }}</strong>
              <p class="howto-text">{{ t("howto.bonus.move") }}</p>
            </div>
          </div>
          <div class="howto-entry">
            <img src="/img/bonus-shield.png" alt="" draggable="false">
            <div>
              <strong>{{ t("bonus.SHIELD") }}</strong>
              <p class="howto-text">{{ t("howto.bonus.shield") }}</p>
            </div>
          </div>
        </div>
        <p class="howto-text">{{ t("howto.bonus.pickup") }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();

const onKey = (event: KeyboardEvent): void => {
  if (event.key === "Escape") emit("close");
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<style scoped>
/*
 * Parchment modal over a dark overlay: same staging as the in-game modals
 * (surrender, victory/defeat, room code), with the parchment texture as
 * the panel background and dark ink typography (Cinzel headings, Alegreya
 * body per the project fonts).
 */
.howto-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 24px;
}

.howto-modal {
  position: relative;
  width: min(860px, 100%);
  max-height: 86vh;
  border-radius: 12px;
  background-image: url("/img/parchemin.png");
  background-size: cover;
  background-position: center;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.7);
  color: #2a1a0f;
}

.howto-close {
  position: absolute;
  top: 10px;
  right: 14px;
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: #2a1a0f;
  cursor: pointer;
  z-index: 2;
}

.howto-scroll {
  overflow-y: auto;
  max-height: 86vh;
  padding: 36px 44px 40px;
}

.howto-heading {
  font-family: var(--font-title);
  font-weight: 700;
  color: #3d2410;
  margin: 18px 0 8px;
}

h1.howto-heading {
  font-size: 1.9rem;
  margin-top: 0;
  text-align: center;
  letter-spacing: 0.06em;
}

h2.howto-heading {
  font-size: 1.25rem;
  border-bottom: 2px solid rgba(61, 36, 16, 0.35);
  padding-bottom: 4px;
}

.howto-text {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.55;
  margin: 0 0 8px;
}

.howto-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 22px;
  margin: 10px 0 14px;
}

.howto-entry {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.howto-entry img {
  width: 46px;
  height: 46px;
  object-fit: contain;
  flex-shrink: 0;
  filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.35));
}

.howto-entry strong {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.95rem;
  color: #3d2410;
}

.howto-crystals {
  display: flex;
  gap: 14px;
  align-items: center;
  margin: 8px 0;
}

.howto-crystals img {
  height: 44px;
  width: auto;
  filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.35));
}

@media (max-width: 640px) {
  .howto-grid {
    grid-template-columns: 1fr;
  }

  .howto-scroll {
    padding: 28px 22px 32px;
  }
}
</style>
