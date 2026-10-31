<template>
  <div class="room">
    <div v-if="!created" class="room-actions">
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
    <div v-else class="room-waiting">
      <p class="waiting">{{ t("room.waiting") }}</p>
      <p class="code">{{ roomCode }}</p>
      <button class="btn" @click="copyCode">{{ copied ? t("room.copied") : t("room.copy") }}</button>
      <button class="btn" @click="cancelRoom">{{ t("matchmaking.cancel") }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
const { t } = useI18n();
const config = useRuntimeConfig();
const router = useRouter();
const created = useState("room-created", () => false);
const roomCode = useState("room-code", () => "");
const joinCode = ref("");
const copied = ref(false);
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
  roomCode.value = data.code;
  created.value = true;
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

const copyCode = async (): Promise<void> => {
  await navigator.clipboard.writeText(roomCode.value);
  copied.value = true;
};

const cancelRoom = (): void => {
  created.value = false;
  roomCode.value = "";
  router.push("/play");
};
</script>

<style scoped>
.room {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-actions,
.room-waiting {
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

.code {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: 0.3em;
  color: var(--accent);
}

.waiting {
  color: var(--text-secondary);
}

.error {
  color: var(--error);
}
</style>
