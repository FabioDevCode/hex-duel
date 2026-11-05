# HEX DUEL

HEX DUEL est un jeu de duel multijoueur en ligne strictement 1 contre 1. Deux joueurs s'affrontent sur une arène hexagonale plate avec des personnages 3D en capsule, lors de tours de sélection d'actions secrètes et simultanées, résolus de manière autoritaire par le serveur.

## Stack

- **Frontend :** Nuxt 4, Vue 3, Three.js
- **Backend :** Node.js, Colyseus (WebSockets)
- **Logique de jeu :** package TypeScript pur, indépendant du framework
- **Persistance :** PostgreSQL, Drizzle ORM
- **Validation :** Zod
- **Monorepo :** pnpm Workspaces
- **Qualité et tests :** TypeScript strict, ESLint, Vitest, Playwright

## Structure du monorepo

```text
apps/
  web/          → application Nuxt (interface, lobby, rendu 3D)
  server/       → serveur Node.js + Colyseus (rooms, matchmaking, autorité)
packages/
  shared/       → types, schémas et constantes partagés
  game-logic/   → logique de jeu pure et déterministe
  tsconfig/     → configuration TypeScript de base
docs/           → spécifications du projet
```

## Commandes

```bash
pnpm install          # installer les dépendances

pnpm dev              # démarrer le frontend et le serveur en parallèle
pnpm dev:web          # démarrer uniquement le frontend Nuxt
pnpm dev:server       # démarrer uniquement le serveur Node.js

pnpm build            # construire tous les packages
pnpm typecheck        # vérifier les types de tous les packages
pnpm lint             # exécuter ESLint sur le monorepo

pnpm test             # exécuter les tests Vitest
pnpm test:e2e         # exécuter les tests Playwright
```

## Documentation

- `docs/GAME_DESIGN.md` — game design
- `docs/MULTIPLAYER_SPEC.md` — spécification multijoueur
- `docs/TECHNICAL_SPEC.md` — spécification technique
- `docs/UI_UX_SPEC.md` — spécification UI/UX
- `DECISIONS.md` — registre des décisions du projet
- `AGENTS.md` — règles de contribution

## License

Ce projet est sous licence [GNU Affero General Public License v3.0 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.html).

Le texte intégral de la licence est disponible dans le fichier [LICENSE](./LICENSE).
