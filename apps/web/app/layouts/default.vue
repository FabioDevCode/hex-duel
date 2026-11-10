<template>
  <div class="layout">
    <header class="layout-header">
      <NuxtLink to="/" class="logo">
        <img src="/img/hex-duel-logo-sm.png" alt="HEX DUEL">
      </NuxtLink>
      <nav class="layout-nav">
        <NuxtLink to="/profile" class="nav-link profile-link" :title="t('nav.profile')">
          <img src="/img/profil.png" :alt="t('nav.profile')" draggable="false" />
        </NuxtLink>
        <LangToggle />
      </nav>
    </header>
    <main class="layout-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
import LangToggle from "~/components/ui/LangToggle.vue";

const { t } = useI18n();
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
  background-color: transparent;
  padding: 12px 16px;
  height: 80px;
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
  overflow: visible;
  filter: drop-shadow(2px 3px 6px rgba(0, 0, 0, 0.7));
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

.profile-link {
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-link img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(2px 3px 6px rgba(0, 0, 0, 0.7));
  transition: transform 0.15s ease;
}

.profile-link:hover img {
  transform: scale(1.08);
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
