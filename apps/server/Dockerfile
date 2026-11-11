# =============================================================================
# HEX DUEL — Colyseus game server (WebSocket 2567 + matchmaking API 2568)
# Build context: the repository ROOT (the pnpm workspace), see compose.prod.yml
#
# Multi-stage:
#   deps    - install the server's dependency tree from the manifests ONLY,
#             so the (slow) install layer is invalidated only when the
#             lockfile or a package.json changes, not on every source edit.
#   final   - installed tree + sources, no build tools beyond what the
#             container needs at runtime and for `pnpm db:push`.
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: dependencies (cached)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps

# pnpm via corepack (the version pinned in package.json is used).
RUN corepack enable

WORKDIR /app

# Manifests only: pnpm needs every workspace package.json to resolve the
# workspace, but no source file. Editing the source never invalidates this
# layer; only the lockfile or a package.json does.
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/game-logic/package.json packages/game-logic/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY apps/server/package.json apps/server/

# Full dependency tree of the server and its workspace packages
# (@hex-duel/shared, @hex-duel/game-logic). devDependencies are kept on
# purpose: tsx runs the server at runtime (see CMD) and drizzle-kit powers
# the one-time `docker compose exec server pnpm db:push`.
RUN pnpm install --frozen-lockfile --filter @hex-duel/server...

# ---------------------------------------------------------------------------
# Stage 2: runtime image
# ---------------------------------------------------------------------------
FROM node:22-alpine

RUN corepack enable

WORKDIR /app

ENV NODE_ENV=production

# Installed workspace tree (node_modules + the per-package symlinks) from
# the cached stage...
COPY --from=deps /app ./
# ...then the sources only: the server and the workspace packages, which
# export TypeScript source consumed by tsx at runtime.
COPY apps/server ./apps/server
COPY packages ./packages

WORKDIR /app/apps/server

EXPOSE 2567 2568

# tsx from the server's own node_modules (no npx resolution at start).
CMD ["node_modules/.bin/tsx", "src/index.ts"]
