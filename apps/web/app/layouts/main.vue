<template>
  <div class="layout">
    <header class="layout-header">
      <NuxtLink to="/" class="logo">
        <div>

        </div>
      </NuxtLink>
      <nav class="layout-nav">
        <NuxtLink to="/play" class="nav-link">{{ t("nav.play") }}</NuxtLink>
        <NuxtLink to="/profile" class="nav-link">{{ t("nav.profile") }}</NuxtLink>
        <select
          class="lang-select"
          :value="locale"
          @change="setLocale(($event.target as HTMLSelectElement).value as Locale)"
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
        </select>
      </nav>
    </header>
    <main class="layout-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
const { t, locale, setLocale } = useI18n();
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

.logo div {
  height: 44px;
}

.layout-nav {
  display: flex;
  align-items: center;
  gap: 24px;
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

.lang-select {
  background-color: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-main);
  padding: 4px 8px;
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
