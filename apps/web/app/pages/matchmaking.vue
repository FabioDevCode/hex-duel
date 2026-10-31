<template>
  <div class="matchmaking">
    <p class="searching">{{ t("matchmaking.searching") }}</p>
    <div class="spinner" />
    <button class="btn" @click="cancelAndBack">{{ t("matchmaking.cancel") }}</button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
import { useMatchmaking } from "~/composables/useMatchmaking";

const { t } = useI18n();
const { startQuickMatch, cancel } = useMatchmaking();
const router = useRouter();

const cancelAndBack = (): void => {
  cancel();
  router.push("/play");
};

onMounted(() => {
  startQuickMatch();
});

onBeforeUnmount(cancel);
</script>

<style scoped>
.matchmaking {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
}

.searching {
  font-size: 1.3rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
