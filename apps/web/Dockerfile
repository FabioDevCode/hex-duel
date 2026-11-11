# =============================================================================
# HEX DUEL — Nuxt 4 web application
# Build context: the repository ROOT (the pnpm workspace), see compose.prod.yml
#
# Multi-stage:
#   builder - install the web app's dependency tree from the manifests ONLY
#             (cached), then copy the sources and build the Nuxt output.
#   final   - ONLY the .output directory: Nitro bundles the traced server
#             dependencies (workspace packages included), so the final
#             image ships no node_modules and no source code.
#
# The listening port is provided by the PORT environment variable at
# container start (3333 in production via compose.prod.yml) - never
# hardcoded here. The public runtime config (NUXT_PUBLIC_SERVER_URL,
# NUXT_PUBLIC_MATCHMAKING_URL) is likewise injected at start, not at build.
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: dependencies + build
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

# pnpm via corepack (the version pinned in package.json is used).
RUN corepack enable

WORKDIR /app

# Manifests only: pnpm needs every workspace package.json to resolve the
# workspace, but no source file. Editing the source never invalidates the
# install layer; only the lockfile or a package.json does.
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/game-logic/package.json packages/game-logic/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile --filter @hex-duel/web...

# Sources and build (the "build" script runs `nuxt build`).
COPY . .
RUN pnpm --filter @hex-duel/web build

# ---------------------------------------------------------------------------
# Stage 2: runtime image (only the self-contained Nuxt output)
# ---------------------------------------------------------------------------
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
# Documentation only: the real port comes from PORT at runtime (3333 in
# production).
EXPOSE 3333

COPY --from=builder /app/apps/web/.output ./

CMD ["node", "server/index.mjs"]
