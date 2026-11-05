<template>
  <div class="profile">
    <h1>{{ t("nav.profile") }}</h1>
    <div v-if="stats" class="stats panel">
      <div class="stat">
        <span class="stat-value">{{ stats.matchesPlayed }}</span>
        <span class="stat-label text-secondary">{{ t("profile.matches") }}</span>
      </div>
      <div class="stat win">
        <span class="stat-value">{{ stats.wins }}</span>
        <span class="stat-label text-secondary">{{ t("profile.wins") }}</span>
      </div>
      <div class="stat loss">
        <span class="stat-value">{{ stats.losses }}</span>
        <span class="stat-label text-secondary">{{ t("profile.losses") }}</span>
      </div>
      <div class="stat draw">
        <span class="stat-value">{{ stats.draws }}</span>
        <span class="stat-label text-secondary">{{ t("profile.draws") }}</span>
      </div>
    </div>
    <p v-else class="text-secondary">{{ t("profile.noData") }}</p>
    <div class="pseudonym panel">
      <label class="pseudo-label" for="pseudo-input">{{ t("profile.pseudonym") }}</label>
      <div class="pseudo-row">
        <input
          id="pseudo-input"
          v-model="pseudoInput"
          class="pseudo-input"
          type="text"
          maxlength="24"
          :placeholder="pseudonym"
        >
        <button class="btn btn-primary" @click="savePseudonym">{{ t("profile.pseudonymSave") }}</button>
      </div>
      <p v-if="pseudoFeedback === 'saved'" class="pseudo-feedback ok">{{ t("profile.pseudonymSaved") }}</p>
      <p v-else-if="pseudoFeedback === 'invalid'" class="pseudo-feedback error">{{ t("profile.pseudonymInvalid") }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
import { usePseudonym } from "~/composables/usePseudonym";

const { t } = useI18n();
const config = useRuntimeConfig();
const { pseudonym, setPseudonym } = usePseudonym();

const pseudoInput = ref("");
const pseudoFeedback = ref<"idle" | "saved" | "invalid">("idle");

const savePseudonym = (): void => {
  const result = setPseudonym(pseudoInput.value);
  if (result.ok) {
    pseudoInput.value = "";
    pseudoFeedback.value = "saved";
  } else {
    pseudoFeedback.value = "invalid";
  }
};

type Stats = { matchesPlayed: number; wins: number; losses: number; draws: number };
const stats = ref<Stats | null>(null);

onMounted(async () => {
  const playerId = localStorage.getItem("hex-duel-player-id");
  if (!playerId) return;
  try {
    const response = await fetch(`${config.public.matchmakingUrl}/api/profile/${playerId}`);
    if (response.ok) {
      stats.value = (await response.json()) as Stats;
    }
  } catch {
    // Server unreachable: keep the empty profile.
  }
});
</script>

<style scoped>
.profile {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.stats {
  display: flex;
  gap: 48px;
  padding: 32px 48px;
}

.pseudonym {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 28px;
  min-width: 320px;
}

.pseudo-label {
  font-weight: 700;
  letter-spacing: 0.06em;
  font-size: 0.85rem;
}

.pseudo-row {
  display: flex;
  gap: 10px;
}

.pseudo-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-panel);
  color: var(--text-main);
  font-size: 1rem;
}

.pseudo-feedback {
  font-size: 0.85rem;
  margin: 0;
  min-height: 1.2em;
}

.pseudo-feedback.ok {
  color: var(--success);
}

.pseudo-feedback.error {
  color: var(--error);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-value {
  font-size: 2.2rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.win .stat-value {
  color: var(--success);
}

.loss .stat-value {
  color: var(--player-red);
}

.draw .stat-value {
  color: var(--warning);
}

.stat-label {
  font-size: 0.85rem;
  letter-spacing: 0.08em;
}
</style>
