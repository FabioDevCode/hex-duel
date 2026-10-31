<template>
  <button class="btn" :class="{ 'btn-primary': primary }" :disabled="disabled" @click="$emit('click')">
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  primary?: boolean;
  disabled?: boolean;
}>();

defineEmits<{ click: [] }>();
</script>
