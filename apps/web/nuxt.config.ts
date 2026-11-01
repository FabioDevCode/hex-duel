export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: false },
  css: ["~/assets/css/main.css"],
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
