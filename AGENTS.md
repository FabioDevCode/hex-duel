# AGENTS.md

# HEX DUEL — AI Agent Instructions

## 1. Purpose

This file defines the working rules for AI agents contributing to HEX DUEL.

It is a contribution guide. It does not replace the project specifications.

The specifications in `docs/` define the expected product and technical behavior. `DECISIONS.md` records the status of project decisions.

## 2. Read Before Working

Before implementing anything, read:

1. `README.md`
2. `DECISIONS.md`
3. `docs/GAME_DESIGN.md`
4. `docs/MULTIPLAYER_SPEC.md`
5. `docs/TECHNICAL_SPEC.md`
6. `docs/UI_UX_SPEC.md`

Do not assume that a proposed or pending decision is already approved.

If specifications contradict each other, stop and report the conflict. Do not invent a resolution.

## 3. Decision Management

Respect the status of every decision in `DECISIONS.md`.

- **ACCEPTED:** Must be followed. Do not change without explicit authorization.
- **PROPOSED:** Not final. Do not treat as approved.
- **PENDING:** Requires clarification before implementation when relevant.
- **SUPERSEDED:** No longer applies.

If implementation requires a new decision:

1. Explain why it is needed.
2. Present the available options and their consequences.
3. Ask for approval when the decision affects product behavior or architecture.
4. Update `DECISIONS.md` only after approval.

Never silently change an accepted decision.

## 4. Project Scope

The target is the HEX DUEL MVP:

- Strictly 1 vs 1 multiplayer gameplay.
- Random matchmaking and private rooms.
- A flat hexagonal arena.
- 3D capsule characters.
- Simultaneous secret action selection.
- Server-authoritative turn resolution.
- The actions and mechanics defined in the Game Design Document.

Do not add features outside the MVP unless explicitly requested.

Do not independently introduce shops, cosmetics, chat, tournaments, additional maps, obstacles, or other gameplay systems.

## 5. Required Technology Stack

Use the technologies defined in `docs/TECHNICAL_SPEC.md`:

- Nuxt 4 and Vue 3 for the web application.
- Three.js for 3D rendering.
- TypeScript.
- Node.js and Colyseus for multiplayer server functionality.
- PostgreSQL and Drizzle ORM for persistence.
- Zod for runtime validation.
- pnpm workspaces for the monorepo.
- Vitest for unit and integration tests.
- Playwright for browser and end-to-end tests.

Do not introduce Turborepo.

Do not replace Three.js with Phaser or another rendering engine.

Do not replace the selected backend, database, or ORM without explicit approval.

Before adding a dependency, check whether an existing dependency already provides the required functionality. Verify compatibility with the project's versions.

## 6. Monorepo Architecture

Respect the following separation of responsibilities:

- `apps/web/`: Nuxt application, interface, menus, lobby, and Three.js client rendering.
- `apps/server/`: Node.js server, Colyseus rooms, matchmaking, sessions, and server-side game orchestration.
- `packages/shared/`: Shared types, schemas, constants, and network contracts.
- `packages/game-logic/`: Pure game rules and deterministic calculations.
- `docs/`: Product and technical specifications.

Do not mix frontend rendering code with game rules.

The `game-logic` package must remain independent of Vue, Nuxt, Three.js, Colyseus, and browser APIs.

Keep module boundaries clear and avoid unnecessary cross-package dependencies.

## 7. Multiplayer and Game Logic Rules

The server is authoritative.

- Never trust client-reported game results, positions, damage, or turn outcomes.
- Validate every network message on the server.
- Use shared schemas where appropriate.
- Keep secret player actions private until the server resolves the turn.
- Never expose an opponent's unsubmitted or hidden action through public Colyseus state.
- Ensure turn resolution is deterministic.
- Prevent duplicate or late submissions from being applied more than once.
- Keep timing and action ordering under server control.

The game logic must be testable without starting the web application or multiplayer server.

Do not implement unresolved gameplay rules by guessing. Refer to `DECISIONS.md` and request clarification when necessary.

## 8. Code Quality

- Use TypeScript strict mode.
- Prefer explicit types and clear function names.
- Keep functions focused and reasonably small.
- Avoid unnecessary abstractions and speculative architecture.
- Avoid duplicated business logic.
- Handle errors explicitly.
- Do not use `any` unless there is a documented and justified reason.
- Keep code readable and maintainable.

Do not perform broad refactoring when a small targeted change is sufficient.

## 9. Database and Configuration

- Use Drizzle ORM for database access.
- Manage schema changes through migrations.
- Do not modify production data structures without explaining the impact.
- Keep environment-specific configuration outside source code.
- Maintain an up-to-date `.env.example`.
- Never commit secrets, passwords, private keys, or production credentials.

## 10. Testing and Validation

Every feature or meaningful code change must include appropriate tests.

Use:

- Vitest for game logic, shared packages, server behavior, and unit/integration tests.
- Playwright for browser-level and end-to-end behavior.

Before considering a task complete, run the relevant checks:

1. Tests.
2. Type checking.
3. Linting, if configured.

Do not claim that a check passed if it was not actually executed.

If a check cannot be run, explain why.

## 11. Implementation Workflow

Work incrementally.

Before starting a substantial task:

1. Explain the objective.
2. Identify the files and packages affected.
3. Describe the implementation steps.
4. Identify any unresolved decisions or risks.

Implement one coherent task at a time.

Do not attempt to build the entire game in one operation.

Suggested implementation phases:

1. Bootstrap the pnpm monorepo and development tooling.
2. Implement shared types, schemas, and game logic.
3. Implement the multiplayer server, rooms, and player sessions.
4. Implement the Nuxt frontend and Three.js arena.
5. Implement menus, lobby, matchmaking, and gameplay interface.
6. Implement database persistence and player statistics.
7. Add end-to-end tests and improve reliability.
8. Prepare deployment and production configuration.

The order may be adjusted when justified, but dependencies between phases must be respected.

## 12. Documentation

Keep documentation aligned with the implementation.

Do not silently modify:

- `docs/GAME_DESIGN.md`
- `docs/MULTIPLAYER_SPEC.md`
- `docs/TECHNICAL_SPEC.md`
- `docs/UI_UX_SPEC.md`
- `DECISIONS.md`

If a specification needs changing, explain the reason and propose the change before applying it.

## 13. Completion Report

After each task, provide a concise report containing:

- What was implemented.
- Files created or modified.
- Tests and checks executed, with their results.
- New dependencies, if any, and why they were needed.
- Decisions required or added.
- Known limitations or remaining issues.

Do not start the next substantial task automatically. Present the next recommended step and wait for approval when appropriate.

## 14. General Principle

Prioritize correctness, simplicity, security, and maintainability.

Follow the approved specifications.

When information is missing, ask rather than guess.

Build HEX DUEL step by step, keeping the MVP scope under control.
