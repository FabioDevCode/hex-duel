export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: false },
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    public: {
      serverUrl: process.env.SERVER_URL ?? "ws://localhost:2567",
      matchmakingUrl: process.env.MATCHMAKING_URL ?? "http://localhost:2567",
    },
  },
  app: {
    head: {
      title: "HEX DUEL",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },
});
