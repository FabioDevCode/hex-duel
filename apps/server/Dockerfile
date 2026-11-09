# =============================================================================
# HEX DUEL — Colyseus game server (WebSocket 2567 + matchmaking API 2568)
# Build context: the repository ROOT (the pnpm workspace), see compose.prod.yml
# =============================================================================
FROM node:22-alpine

# pnpm via corepack (the version pinned in package.json is used).
RUN corepack enable

WORKDIR /app

# Install the workspace dependencies of the server (and its workspace
# packages: @hex-duel/shared, @hex-duel/game-logic).
COPY . .
RUN pnpm install --frozen-lockfile --filter @hex-duel/server...

WORKDIR /app/apps/server

# The server runs through tsx (no compiled build step in the project).
ENV NODE_ENV=production
EXPOSE 2567 2568

CMD ["npx", "tsx", "src/index.ts"]
