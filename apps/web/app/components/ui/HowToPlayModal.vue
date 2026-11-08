<template>
  <div class="howto-backdrop" @click.self="emit('close')">
    <div class="howto-modal" role="dialog" :aria-label="t('howto.title')">
      <button class="howto-close" :aria-label="t('howto.close')" @click="emit('close')">&times;</button>

      <div class="howto-page">
        <!-- Page 1: concept -->
        <template v-if="page === 0">
          <h1 class="howto-heading center">{{ t("howto.title") }}</h1>
          <div class="howto-fighters">
            <img src="/img/profil-samourai.png" alt="" draggable="false">
            <img src="/img/profil-chevalier.png" alt="" draggable="false">
          </div>
          <p class="howto-text big">{{ t("howto.concept") }}</p>
        </template>

        <!-- Page 2: turns -->
        <template v-else-if="page === 1">
          <h1 class="howto-heading center">{{ t("howto.turnsTitle") }}</h1>
          <p class="howto-text big">{{ t("howto.turns") }}</p>
        </template>

        <!-- Page 3: actions -->
        <template v-else-if="page === 2">
          <h1 class="howto-heading center">{{ t("howto.actionsTitle") }}</h1>
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
        </template>

        <!-- Page 4: crystals -->
        <template v-else-if="page === 3">
          <h1 class="howto-heading center">{{ t("howto.crystalsTitle") }}</h1>
          <div class="howto-crystals">
            <img src="/img/crystal-red-hex.png" alt="" draggable="false">
            <img src="/img/crystal-blue-hex.png" alt="" draggable="false">
            <img src="/img/crystal-broken-hex.png" alt="" draggable="false">
            <img src="/img/crystal-green-hex.png" alt="" draggable="false">
          </div>
          <p class="howto-text big">{{ t("howto.crystals") }}</p>
        </template>

        <!-- Page 5: bonuses -->
        <template v-else>
          <h1 class="howto-heading center">{{ t("howto.bonusTitle") }}</h1>
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
        </template>
      </div>

      <!-- Pagination footer -->
      <div class="howto-nav">
        <button class="howto-nav-btn" :disabled="page === 0" @click="page--">
          {{ t("howto.prev") }}
        </button>
        <div class="howto-dots">
          <button
            v-for="index in pageCount"
            :key="index"
            class="howto-dot"
            :class="{ active: index - 1 === page }"
            :aria-label="`${index}`"
            @click="page = index - 1"
          />
        </div>
        <button v-if="page < pageCount - 1" class="howto-nav-btn" @click="page++">
          {{ t("howto.next") }}
        </button>
        <button v-else class="howto-nav-btn" @click="emit('close')">
          {{ t("howto.close") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();

const pageCount = 5;
const page = ref(0);

const onKey = (event: KeyboardEvent): void => {
  if (event.key === "Escape") emit("close");
  if (event.key === "ArrowRight" && page.value < pageCount - 1) page.value++;
  if (event.key === "ArrowLeft" && page.value > 0) page.value--;
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<style scoped>
/*
 * Paginated parchment modal over a dark overlay: one section per page
 * (concept, turns, actions, crystals, bonuses), fixed-height content
 * area, prev/next navigation with page dots. Dark ink typography
 * (Cinzel headings, Alegreya body per the project fonts).
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
  width: min(980px, 100%);
  border-radius: 12px;
  background-image: url("/img/parchemin.png");
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
  color: whitesmoke;
  display: flex;
  flex-direction: column;
}

.howto-close {
  position: absolute;
  top: 10px;
  right: 14px;
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: whitesmoke;
  cursor: pointer;
  z-index: 2;
  height: 40px;
  width: 40px;
}

.howto-page {
  /* Fixed height so every page keeps the same parchment footprint. */
  min-height: 430px;
  height: 90svh;
  padding: 90px 120px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.howto-heading {
  font-family: var(--font-title);
  font-weight: 700;
  color: whitesmoke;
  margin: 0 0 8px;
}

.howto-heading.center {
  text-align: center;
  font-size: 1.7rem;
  letter-spacing: 0.06em;
  width: 90%;
  margin: 0 auto;
  border-bottom: 2px solid rgba(0, 0, 0, 0.35);
  padding-bottom: 8px;
}


.howto-text {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: .9rem;
  color: rgba(245, 245, 245, .8);
  line-height: 1.55;
  margin: 0;
}

.howto-text.big {
  font-size: 1.08rem;
  line-height: 1.65;
}

.howto-fighters {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin: 4px 0;
}

.howto-fighters img {
  width: 220px;
  height: 88px;
  object-fit: contain;
  filter: drop-shadow(2px 3px 4px rgba(0, 0, 0, 0.35));
}

.howto-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 22px;
  margin: 6px 0;
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
  color: whitesmoke;
}

.howto-crystals {
  display: flex;
  justify-content: center;
  gap: 16px;
  align-items: center;
  margin: 6px 0;
}

.howto-crystals img {
  height: 48px;
  width: auto;
  filter: drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.35));
}

.howto-nav {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 0px 24px 18px;
  margin: 0 auto;
}

.howto-nav-btn {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  background-image: linear-gradient(
      160deg,
    #CB5901,
    #FD9909,
    #FCF069,
    #FD9909,
    #CB5901
  );
  color: #ac4a00;
  text-shadow: 0 1px 1px #FCF069;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.16),
    0 3px 6px rgba(110, 80, 20, 0.4),
    inset 0 -2px 5px 1px rgba(203, 89, 1, 1),
    inset 0 -1px 1px 3px rgba(250, 227, 133, 1);
  border: none;
  border-radius: 8px;
  padding: 9px 22px;
  min-width: 110px;
  cursor: pointer;
  transition: background 0.15s;
}

.howto-nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.howto-dots {
  display: flex;
  gap: 8px;
}

.howto-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  background: rgba(250, 250, 250, 0.3);
  cursor: pointer;
  padding: 0;
  transition: background 0.15s;
}

.howto-dot.active {
  background: #f9f7f6;
}

@media (max-width: 640px) {
  .howto-page {
    padding: 32px 22px 12px;
    min-height: 480px;
  }

  .howto-grid {
    grid-template-columns: 1fr;
  }

  .howto-nav-btn {
    min-width: 84px;
    padding: 8px 12px;
  }
}
</style>
