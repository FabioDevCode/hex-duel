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

.layout-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background-color: transparent;
}

.logo {
  color: var(--accent);
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: 0.12em;
  text-decoration: none;
}

.logo img {
  height: 40px;
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.95rem;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--text-main);
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
