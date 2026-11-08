<template>
  <Transition name="credits-fade">
    <div v-if="visible" class="credits-overlay" role="dialog" aria-label="Crédits">
      <button class="credits-close" aria-label="Fermer les crédits" @click="emit('close')">
        &#10005;
      </button>

      <div
        ref="container"
        class="credits-scroll"
        @wheel="onUserScroll"
        @touchstart="onUserScroll"
        @pointerdown="onUserScroll"
      >
        <div class="credits-content">
          <h1 class="credits-title">HEXDUEL</h1>
          <p class="credits-subtitle">
            Un jeu développé par un humain et trois IA qui ne sont jamais tombées d'accord.
          </p>

          <section v-for="section in sections" :key="section.title" class="credits-section">
            <h2 class="credits-heading">&mdash; {{ section.title }} &mdash;</h2>
            <p v-for="entry in section.entries" :key="entry[0]" class="credits-entry">
              <span class="credits-role">{{ entry[0] }}</span>
              <span class="credits-name">{{ entry[1] }}</span>
            </p>
          </section>

          <section class="credits-section">
            <h2 class="credits-heading">&mdash; Remerciements &mdash;</h2>
            <p v-for="line in thanks" :key="line" class="credits-line">{{ line }}</p>
          </section>

          <div class="credits-footer">
            <p class="credits-line">
              Ce projet n'avait aucune prétention : juste l'envie de découvrir comment créer
              un petit jeu en ligne de A à Z, aidé par des IA pour le code, l'art et la 3D.
            </p>
            <p class="credits-line">
              Toute ressemblance avec un vrai studio de développement est purement fortuite —
              ici, le lead dev, le QA et le compositeur partagent le même lit.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Film-style credits overlay (UI_UX: full-screen, auto-scrolling from the
 * bottom up like end credits). The auto-scroll pauses while the user scrolls
 * manually and resumes after ~1.5s; it stops for good at the end. Closing
 * resets the scroll so the next opening starts from the beginning.
 */

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ close: [] }>();

const container = ref<HTMLDivElement | null>(null);

const sections: { title: string; entries: [string, string][] }[] = [
  {
    title: "Direction & Production",
    entries: [
      ["Producteur exécutif", "Fabio (il a aussi financé le projet : 0 €)"],
      ["Directeur créatif", "Fabio (toutes les idées viennent de lui, il tient à le préciser)"],
      ["Chef de projet", "Fabio (les réunions étaient très courtes)"],
      ["Product Manager", "Fabio (étude de marché : « j'en avais envie »)"],
      ["Communication interne", "Fabio se parlant à lui-même"],
    ],
  },
  {
    title: "Game Design",
    entries: [
      ["Game Designer", "Fabio (les règles sont de lui, l'IA a juste dit « bonne idée »)"],
      ["Level Designer", "Fabio"],
      ["Balance & Équilibrage", "Fabio (aucun test n'a démenti ses choix, car aucun test n'a été fait)"],
      ["Narrative Designer", "Fabio (« un chevalier et un samouraï se battent. C'est tout. »)"],
      ["UX Design", "Fabio (ergonomie validée par l'utilisateur principal : Fabio)"],
    ],
  },
  {
    title: "Développement",
    entries: [
      ["Développeur principal", "Vibe Code (Mistral)"],
      ["Développeur secondaire", "Fabio (surtout en train de demander à Vibe de corriger)"],
      ["Lead Frontend", "Vibe Code"],
      ["Programmeur gameplay", "Vibe Code, supervisé par un non-développeur"],
      ["Programmeur UI", "Vibe Code (payé 0 €/mois, mais motivé)"],
      ["Ingénieur DevOps", "Vibe Code (Fabio a cliqué sur « déployer »)"],
      ["Relations humaines avec la machine", "Fabio"],
    ],
  },
  {
    title: "Direction Artistique & 3D",
    entries: [
      ["Directeur artistique", "Fabio"],
      ["Character Artist 3D", "Meshy.ai (Fabio n'y a pas touché, il est formel)"],
      ["Environment Artist 3D", "Meshy.ai"],
      ["Animateur 3D", "Meshy.ai (ses premières animations ont été décrites comme « raides », il s'en remettra)"],
      ["Rigging", "Meshy.ai"],
      ["Intégration 3D", "Vibe Code (le seul moment où deux IA ont « collaboré », sans le savoir)"],
    ],
  },
  {
    title: "Art 2D",
    entries: [
      ["Concept Artist", "ChatGPT, parfois Fabio quand l'IA ne comprenait pas"],
      ["Illustrateur 2D", "ChatGPT (a redessiné le logo 47 fois, sans jamais se plaindre)"],
      ["Icon Designer", "ChatGPT"],
      ["Retouche & Rendu final", "Fabio (ses talents sont limités, il fait ce qu'il peut)"],
    ],
  },
  {
    title: "Qualité & Tests",
    entries: [
      ["QA Lead", "Fabio"],
      ["Testeur QA", "Fabio (très mauvais à son propre jeu, c'est encourageant)"],
      ["Beta testeurs", "recrutement en cours (c'est-à-dire ses amis, bientôt)"],
      ["Gestionnaire de bugs", "Fabio (il en a créé plus qu'il n'en a corrigé, selon les mauvaises langues)"],
      ["Assurance qualité finale", "Vibe Code, qui jure qu'il n'a rien changé"],
    ],
  },
  {
    title: "Divers",
    entries: [
      ["Community Manager", "n'existe pas encore"],
      ["Marketing & Growth", "Fabio (stratégie : « on verra »)"],
      ["Support technique", "Fabio (débit de réponse : lent)"],
      ["Département juridique", "Fabio (« on n'est pas responsables, c'est un jeu »)"],
      ["Café & logistique", "Fabio"],
      ["Moral de l'équipe", "stable, malgré tout"],
    ],
  },
];

const thanks: string[] = [
  "Aux GPU du monde entier qui ont chauffé pour ce jeu",
  "À Mistral, OpenAI et Meshy, employés du mois à égalité",
  "À vous, qui lisez les crédits jusqu'ici. Sérieusement ? Merci. 💛",
];

// --- Auto-scroll: slow, constant, pausable, stops at the end ------------
const SCROLL_PX_PER_TICK = 0.6;
const TICK_MS = 30;
const RESUME_DELAY_MS = 1500;

let scrollTimer: ReturnType<typeof setInterval> | null = null;
let resumeTimer: ReturnType<typeof setTimeout> | null = null;

const stopAuto = (): void => {
  if (scrollTimer !== null) {
    clearInterval(scrollTimer);
    scrollTimer = null;
  }
};

const startAuto = (): void => {
  if (scrollTimer !== null || !container.value) return;
  scrollTimer = setInterval(() => {
    const el = container.value;
    if (!el) return;
    // Reached the end: stop for good (no loop).
    if (el.scrollTop >= el.scrollHeight - el.clientHeight - 1) {
      stopAuto();
      return;
    }
    el.scrollTop += SCROLL_PX_PER_TICK;
  }, TICK_MS);
};

/** Manual interaction: pause, then resume after ~1.5s of inactivity. */
const onUserScroll = (): void => {
  stopAuto();
  if (resumeTimer !== null) clearTimeout(resumeTimer);
  resumeTimer = setTimeout(() => {
    resumeTimer = null;
    startAuto();
  }, RESUME_DELAY_MS);
};

const cleanup = (): void => {
  stopAuto();
  if (resumeTimer !== null) {
    clearTimeout(resumeTimer);
    resumeTimer = null;
  }
};

const onKey = (event: KeyboardEvent): void => {
  if (event.key === "Escape") emit("close");
};

let previousBodyOverflow = "";
watch(
  () => props.visible,
  (visible) => {
    // SSR guard: the DOM only exists on the client.
    if (!import.meta.client) return;
    if (visible) {
      // Block the page scroll behind the overlay; fresh open starts at the
      // top (the container renders on the next tick).
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      void nextTick(() => {
        if (container.value) container.value.scrollTop = 0;
        startAuto();
      });
    } else {
      cleanup();
      document.body.style.overflow = previousBodyOverflow;
    }
  },
  { immediate: true },
);

onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  cleanup();
  // onBeforeUnmount only runs on the client.
  document.body.style.overflow = previousBodyOverflow;
});
</script>

<style scoped>
/*
 * Full-screen near-black overlay with a subtle gradient, film-credits
 * typography (Cinzel headings in gold, Alegreya names in off-white) and
 * soft fade masks at the top and bottom edges of the scrolling area.
 */
.credits-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(ellipse at center, rgba(10, 6, 14, 0.97) 0%, rgba(0, 0, 0, 0.99) 100%);
  z-index: 60;
  display: flex;
  justify-content: center;
}

.credits-close {
  position: absolute;
  top: 18px;
  right: 22px;
  background: none;
  border: none;
  font-size: 1.6rem;
  line-height: 1;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: color 0.15s;
  z-index: 2;
}

.credits-close:hover {
  color: rgba(255, 255, 255, 0.95);
}

.credits-scroll {
  width: min(760px, 100%);
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%);
}

.credits-scroll::-webkit-scrollbar {
  display: none;
}

.credits-content {
  padding: 45vh 24px 55vh;
  text-align: center;
}

.credits-title {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 2.6rem;
  letter-spacing: 0.18em;
  color: var(--accent);
  margin: 0 0 10px;
}

.credits-subtitle {
  font-family: var(--font-body);
  font-style: italic;
  font-size: 1.05rem;
  color: rgba(245, 247, 250, 0.75);
  margin: 0 0 70px;
}

.credits-section {
  margin: 0 0 70px;
}

.credits-heading {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 1.35rem;
  letter-spacing: 0.08em;
  color: var(--accent);
  margin: 0 0 26px;
}

.credits-entry {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0 0 18px;
}

.credits-role {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(245, 247, 250, 0.55);
}

.credits-name {
  font-family: var(--font-body);
  font-size: 1.1rem;
  color: #f5f7fa;
}

.credits-line {
  font-family: var(--font-body);
  font-size: 1.1rem;
  line-height: 1.6;
  color: #f5f7fa;
  margin: 0 0 14px;
}

.credits-footer {
  margin-top: 70px;
}

.credits-footer .credits-line {
  font-style: italic;
  color: rgba(245, 247, 250, 0.8);
}

/* ~300ms fade in/out of the overlay itself. */
.credits-fade-enter-active,
.credits-fade-leave-active {
  transition: opacity 0.3s ease;
}

.credits-fade-enter-from,
.credits-fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .credits-title {
    font-size: 1.9rem;
  }

  .credits-heading {
    font-size: 1.15rem;
  }

  .credits-name,
  .credits-line {
    font-size: 1rem;
  }

  .credits-section {
    margin-bottom: 55px;
  }
}
</style>
