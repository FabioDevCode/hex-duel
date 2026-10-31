<template>
  <div class="turn-timer" :class="timerClass">{{ display }}</div>
</template>

<script setup lang="ts">

const props = defineProps<{
  deadlineAt: number;
}>();

const now = ref(Date.now());
let interval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  interval = setInterval(() => {
    now.value = Date.now();
  }, 250);
});

onBeforeUnmount(() => {
  if (interval) clearInterval(interval);
});

const remainingMs = computed(() => Math.max(0, props.deadlineAt - now.value));
const display = computed(() => Math.ceil(remainingMs.value / 1000).toString());
const timerClass = computed(() => {
  const seconds = remainingMs.value / 1000;
  if (seconds <= 5) return "urgent";
  if (seconds <= 10) return "warning";
  return "";
});
</script>

<style scoped>
.turn-timer {
  font-size: 1.6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 56px;
  text-align: center;
}

.warning {
  color: var(--warning);
}

.urgent {
  color: var(--error);
  animation: pulse 0.5s ease-in-out infinite alternate;
}

@keyframes pulse {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.5;
  }
}
</style>
