<template>
  <div class="layout">
    <main class="layout-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-image: url("/img/plaine.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
}
</style>
