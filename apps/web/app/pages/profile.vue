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
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";

const { t } = useI18n();
const config = useRuntimeConfig();

type Stats = { matchesPlayed: number; wins: number; losses: number; draws: number };
const stats = ref<Stats | null>(null);

onMounted(async () => {
  const playerId = localStorage.getItem("hex-duel-player-id");
  if (!playerId) return;
  try {
    const response = await fetch(`${config.public.matchmakingUrl}/profile/${playerId}`);
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
