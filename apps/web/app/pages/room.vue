<template>
  <div class="room">
    <div class="room-actions">
      <button class="btn create-btn golden-button" @click="createRoom">{{ t("room.create") }}</button>
      <hr class="separator">
      <form class="join-form" @submit.prevent="joinRoom">
        <input
          v-model="joinCode"
          class="code-input"
          :placeholder="t('room.code')"
          maxlength="8"
        />
        <button class="btn create-btn golden-button" type="submit" :disabled="joinCode.length < 4">
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
  width: max-content;
}

.create-btn {
  padding: 26px 32px !important;
}

.separator {
  border: none;
  height: 3px;
  border-radius: 10px;
  background-color: #170E1A;
  background: linear-gradient(to right, transparent, black, transparent);
  width: 100%;
  margin: 20px auto;
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 260px;
}

.code-input {
  background-color: rgba(203, 89, 1, 0.15);
  border: 2px solid #170E1A;
  border-radius: 8px;
  color: #170E1A;
  padding: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  width: 100%;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-align: center;
}

input::placeholder {
  color: #CB5901;
  font-weight: 400;
  opacity: .85;
}

input:focus {
  outline: none;
}

.error {
  color: var(--error);
}
</style>
