# =============================================================================
# HEX DUEL — Nuxt 4 web application (port 3000)
# Build context: the repository ROOT (the pnpm workspace), see compose.prod.yml
# =============================================================================
FROM node:22-alpine

# pnpm via corepack (the version pinned in package.json is used).
RUN corepack enable

WORKDIR /app

# Install the workspace dependencies of the web app, then build the Nuxt
# output. The public runtime config (serverUrl / matchmakingUrl) is
# overridden at container start via NUXT_PUBLIC_* environment variables.
COPY . .
RUN pnpm install --frozen-lockfile --filter @hex-duel/web...
RUN pnpm --filter @hex-duel/web nuxt build

WORKDIR /app/apps/web

ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
