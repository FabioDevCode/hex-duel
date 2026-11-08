<template>
  <div class="matchmaking">
    <p class="searching">{{ t("matchmaking.searching") }}</p>

    <img class="spinner" src="/img/spinner.png" alt="spinner">

    <button class="btn back-btn" @click="cancelAndBack">{{ t("matchmaking.cancel") }}</button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
import { useMatchmaking } from "~/composables/useMatchmaking";

const { t } = useI18n();
const { startQuickMatch, cancel, isSearching } = useMatchmaking();
const router = useRouter();

const cancelAndBack = (): void => {
  cancel();
  router.push("/play");
};

onMounted(() => {
  startQuickMatch();
});

// Only cancel an in-flight search. After a successful Quick Match the room is
// joined and /game/:roomId is being shown: leaving it here would disconnect
// the player from the room they just joined.
onBeforeUnmount(() => {
  if (isSearching.value) {
    cancel();
  }
});
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
  font-weight: 600;
  color: whitesmoke;
  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.8));
}

.spinner {
  width: 100px;
  height: 100px;
  animation: spin 1.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
