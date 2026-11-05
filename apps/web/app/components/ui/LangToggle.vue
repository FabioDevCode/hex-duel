<template>
  <button
    ref="buttonRef"
    class="lang-toggle"
    :title="locale === 'fr' ? 'Français' : 'English'"
    :aria-label="locale === 'fr' ? 'Switch to English' : 'Passer en français'"
    @click="toggleLocale"
  >
    <img class="lang-flag" :src="flagSrc" :alt="locale" draggable="false" />
  </button>
</template>

<script setup lang="ts">
import type { Locale } from "~/composables/useI18n";

const { locale, setLocale } = useI18n();

const buttonRef = ref<HTMLButtonElement | null>(null);

const flagSrc = computed(() => (locale.value === "fr" ? "/img/lang-fr.png" : "/img/lang-en.png"));

/**
 * 250ms toggle animation: the button scales down to 0.1 (125ms), the flag
 * swaps at the smallest point, then it scales back up (125ms).
 */
const toggleLocale = (): void => {
  const next: Locale = locale.value === "fr" ? "en" : "fr";
  const el = buttonRef.value;
  if (!el) {
    setLocale(next);
    return;
  }
  const shrink = el.animate(
    [{ transform: "scale(1)" }, { transform: "scale(0.1)" }],
    { duration: 125, easing: "ease-in", fill: "forwards" },
  );
  shrink.onfinish = () => {
    setLocale(next);
    el.animate(
      [{ transform: "scale(0.1)" }, { transform: "scale(1)" }],
      { duration: 125, easing: "ease-out", fill: "forwards" },
    );
  };
};
</script>

<style scoped>
.lang-toggle {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lang-flag {
  width: 42px;
  height: 30px;
  object-fit: contain;
  display: block;
  pointer-events: none;
  filter: drop-shadow(2px 3px 6px rgba(0, 0, 0, 0.7));
}
</style>
