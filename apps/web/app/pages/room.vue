<template>
  <div class="room">
    <div class="room-actions">
      <button class="btn btn-primary" @click="createRoom">{{ t("room.create") }}</button>
      <form class="join-form" @submit.prevent="joinRoom">
        <input
          v-model="joinCode"
          class="code-input"
          :placeholder="t('room.code')"
          maxlength="8"
        />
        <button class="btn" type="submit" :disabled="joinCode.length < 4">
          {{ t("room.join") }}
        </button>
      </form>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
const { t } = useI18n();
const config = useRuntimeConfig();
const joinCode = ref("");
const errorMessage = ref<string | null>(null);

const createRoom = async (): Promise<void> => {
  const response = await fetch(`${config.public.matchmakingUrl}/api/private-room`, {
    method: "POST",
  });
  if (!response.ok) {
    errorMessage.value = t("error.connection");
    return;
  }
  const data: { roomId: string; code: string } = (await response.json()) as {
    roomId: string;
    code: string;
  };
  // The invitation code is shown on the game page while waiting for the
  // opponent; sessionStorage survives a page reload there.
  sessionStorage.setItem(`hex-duel-private-code-${data.roomId}`, data.code);
  await navigateTo(`/game/${data.roomId}`);
};

const joinRoom = async (): Promise<void> => {
  const code = joinCode.value.trim().toUpperCase();
  if (code.length < 4) return;
  const response = await fetch(`${config.public.matchmakingUrl}/api/private-room`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (response.status === 404) {
    errorMessage.value = t("room.invalidCode");
    return;
  }
  if (response.status === 409) {
    errorMessage.value = t("room.roomFull");
    return;
  }
  if (!response.ok) {
    errorMessage.value = t("error.connection");
    return;
  }
  const data: { roomId: string } = (await response.json()) as { roomId: string };
  await navigateTo(`/game/${data.roomId}`);
};
</script>

<style scoped>
.room {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.join-form {
  display: flex;
  gap: 12px;
}

.code-input {
  background-color: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-main);
  padding: 12px 16px;
  font-size: 1.1rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  width: 220px;
  text-align: center;
}

.error {
  color: var(--error);
}
</style>
