<template>
  <div class="matchmaking">
    <p class="searching">{{ t("matchmaking.searching") }}</p>
    <div class="spinner" />
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
  color: #170E1A;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 2px solid #170E1A;
  corner-shape: bevel;
  border-radius: 14px;
  background-image: linear-gradient(
      160deg,
      #CB5901,
      #FD9909,
      #FCF069,
      #FD9909,
      #CB5901
  );
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
