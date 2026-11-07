export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: false },
  css: [
    // Local variable fonts (no network dependency on Google Fonts):
    // Cinzel 400-900, Alegreya 400-900 + italic. Fontsource emits one
    // variable woff2 per subset with unicode-range, so the browser only
    // downloads latin / latin-ext (French accents e è ê à ç oe).
    "@fontsource-variable/cinzel",
    "@fontsource-variable/alegreya",
    "@fontsource-variable/alegreya/wght-italic.css",
    "~/assets/css/main.css",
  ],
  vite: {
    optimizeDeps: {
      include: [
        '@colyseus/sdk',
        'three',
        'zod',
      ]
    }
  },
  runtimeConfig: {
    public: {
      serverUrl: process.env.SERVER_URL ?? "ws://localhost:2567",
      matchmakingUrl: process.env.MATCHMAKING_URL ?? "http://localhost:2568",
    },
  },
  app: {
    head: {
      title: "HEX DUEL",
      link: [
        { rel: "icon", type: "image/png", href: "/favicon.png" },
      ],
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },
});
