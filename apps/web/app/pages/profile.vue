<template>
  <div class="profile">
    <h1>{{ t("nav.profile") }}</h1>
    <p class="text-secondary">—</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
const { t } = useI18n();
</script>

<style scoped>
.profile {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
</style>
