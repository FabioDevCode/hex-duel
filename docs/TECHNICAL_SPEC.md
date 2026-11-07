# HEX DUEL — TECHNICAL SPECIFICATION

**Version :** 0.1  
**Statut :** Draft — architecture technique de référence  
**Projet :** HEX DUEL  
**Langage principal :** TypeScript  
**Architecture :** Monorepo pnpm Workspaces

---

# 1. Objectif du document

Ce document définit l'architecture technique de HEX DUEL et les règles de développement à respecter pendant son implémentation.

Il sert de référence à l'agent IA chargé de développer le projet.

Il décrit :

- Les technologies utilisées.
- L'organisation du monorepo.
- L'architecture frontend et backend.
- Le moteur de rendu 3D.
- La logique de jeu.
- Le système multijoueur.
- La communication client-serveur.
- La persistance des données.
- La sécurité.
- Les tests.
- Le déploiement.

Les règles fonctionnelles du jeu sont définies dans `GAME_DESIGN.md`.

Les règles du système multijoueur sont définies dans `MULTIPLAYER_SPEC.md`.

En cas de contradiction, ces documents doivent être harmonisés avant toute modification du comportement du jeu.

---

# 2. Stack technique

## 2.1 Technologies principales

| Domaine                 | Technologie | Utilisation                |
| ----------------------- | ----------- | -------------------------- |
| Framework frontend      | Nuxt 4      | Application web            |
| Interface utilisateur   | Vue 3       | Composants et interface    |
| Langage                 | TypeScript  | Frontend et backend        |
| Rendu 3D                | Three.js    | Arène et personnages       |
| Serveur                 | Node.js     | Exécution backend          |
| Multijoueur             | Colyseus    | Rooms et synchronisation   |
| Communication           | WebSockets  | Échanges client-serveur    |
| Base de données         | PostgreSQL  | Données persistantes       |
| ORM                     | Drizzle ORM | Accès à la base de données |
| Validation              | Zod         | Validation des données     |
| Gestionnaire de paquets | pnpm        | Dépendances et monorepo    |
| Tests unitaires         | Vitest      | Tests de logique           |
| Tests navigateur        | Playwright  | Tests de bout en bout      |

## 2.2 Principes de sélection

Les dépendances doivent être choisies en privilégiant :

- La stabilité.
- La compatibilité avec Node.js et TypeScript.
- La maintenance active.
- La simplicité d'intégration.
- La documentation officielle.

Les versions exactes des dépendances seront définies au moment de l'installation.

L'agent IA doit utiliser des versions stables et mutuellement compatibles, et conserver les versions installées dans les fichiers de verrouillage du projet.

Les versions ne doivent pas être mises à jour automatiquement sans vérification de compatibilité.

## 2.3 Technologies non retenues

Les technologies suivantes ne font pas partie de l'architecture retenue :

- Phaser : le projet nécessite un véritable environnement 3D.
- Unity : inutilement complexe pour le périmètre du MVP web.
- Unreal Engine : non adapté à l'objectif de simplicité du projet.
- Socket.io : Colyseus est retenu pour la gestion des rooms et de l'état multijoueur.
- Turborepo : non utilisé.
- Redux : non nécessaire pour le frontend Vue.
- Microservices : non nécessaires pour le MVP.

---

# 3. Architecture générale

## 3.1 Principe

Le projet utilise une architecture client-serveur avec séparation entre :

1. L'application web.
2. Le serveur multijoueur.
3. Les packages partagés.
4. La base de données.

Le serveur est l'autorité de référence pour toutes les règles du jeu.

Le client est responsable du rendu et des interactions utilisateur.

## 3.2 Vue d'ensemble

```text
                 JOUEUR 1
                     |
                     |
                 JOUEUR 2
                     |
                     v
             APPLICATION WEB
                Nuxt 4
                Vue 3
                Three.js
                     |
                     |
                 WebSocket
                     |
                     v
             SERVEUR MULTIJOUEUR
                  Node.js
                  Colyseus
                     |
          +----------+----------+
          |                     |
          v                     v
     GAME LOGIC             DATABASE
     TypeScript             PostgreSQL
          |                     |
          v                     v
     SHARED TYPES           Drizzle ORM
     VALIDATION
```

## 3.3 Autorité serveur

Le serveur calcule et valide :

- Les déplacements.
- Les collisions.
- Les attaques.
- Les dégâts.
- Les points de vie.
- Les priorités.
- Les conditions de victoire.
- Les résultats des parties.

Le client ne doit jamais calculer un résultat définitif.

Le rendu graphique peut utiliser des interpolations et animations locales, mais celles-ci ne modifient pas l'état réel de la partie.

---

# 4. Organisation du monorepo

## 4.1 Structure des dossiers

La structure du projet doit être la suivante :

```text
hex-duel/
│
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── game/
│   │   │   │   ├── lobby/
│   │   │   │   └── ui/
│   │   │   │
│   │   │   ├── composables/
│   │   │   ├── layouts/
│   │   │   ├── pages/
│   │   │   ├── plugins/
│   │   │   └── assets/
│   │   │
│   │   ├── public/
│   │   ├── nuxt.config.ts
│   │   └── package.json
│   │
│   └── server/
│       ├── src/
│       │   ├── rooms/
│       │   ├── services/
│       │   ├── database/
│       │   ├── auth/
│       │   ├── matchmaking/
│       │   ├── config/
│       │   └── index.ts
│       │
│       └── package.json
│
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── schemas/
│   │   │   ├── constants/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── game-logic/
│       ├── src/
│       │   ├── movement/
│       │   ├── combat/
│       │   ├── collision/
│       │   ├── arena/
│       │   ├── turns/
│       │   ├── simulation/
│       │   └── index.ts
│       └── package.json
│
├── docs/
│   ├── GAME_DESIGN.md
│   ├── TECHNICAL_SPEC.md
│   ├── UI_UX_SPEC.md
│   ├── MULTIPLAYER_SPEC.md
│   └── DECISIONS.md
│
├── AGENTS.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
└── .gitignore
```

Cette structure peut évoluer si une évolution technique le justifie, mais toute modification importante doit être documentée.

## 4.2 Rôle des applications

### apps/web

Contient l'application frontend Nuxt.

Responsabilités :

- Pages et navigation.
- Menus.
- Lobby.
- Interface de jeu.
- Connexion au serveur multijoueur.
- Rendu 3D avec Three.js.
- Affichage des résultats.

### apps/server

Contient le serveur Node.js et Colyseus.

Responsabilités :

- Gestion des connexions.
- Gestion des rooms.
- Matchmaking.
- Salons privés.
- Authentification.
- Validation des actions.
- Exécution de la logique de jeu.
- Persistance des résultats.

### packages/shared

Contient les éléments communs au frontend et au backend.

Responsabilités :

- Types TypeScript.
- Interfaces.
- Enums.
- Constantes.
- Schémas de validation Zod.
- Structures des messages réseau.

Ce package ne doit pas contenir de logique spécifique à Three.js ou à Colyseus.

### packages/game-logic

Contient la logique pure du jeu.

Responsabilités :

- Déplacements.
- Géométrie de l'arène.
- Collisions.
- Attaques.
- Calcul des dégâts.
- Résolution des tours.
- Conditions de victoire.

Ce package doit être indépendant de Vue, Nuxt, Three.js et Colyseus.

Il doit pouvoir être testé sans lancer de serveur ni navigateur.

---

# 5. Configuration du monorepo

## 5.1 pnpm Workspaces

Le projet utilise pnpm Workspaces pour gérer les applications et les packages.

Le fichier `pnpm-workspace.yaml` doit déclarer :

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## 5.2 Package root

Le `package.json` racine doit centraliser les commandes de développement.

Commandes prévues :

```bash
pnpm dev
pnpm dev:web
pnpm dev:server
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

Chaque commande doit être reliée à un script réellement disponible dans les packages concernés.

Aucun système de gestion de tâches supplémentaire n'est nécessaire pour le MVP.

## 5.3 Dépendances internes

Les applications doivent importer les packages internes via leurs noms de package.

Exemples :

```ts
import { PlayerActionSchema } from "@hex-duel/shared";

import { resolveTurn } from "@hex-duel/game-logic";
```

Les imports directs vers les dossiers internes d'un autre package sont à éviter.

---

# 6. Frontend — Nuxt, Vue et Three.js

## 6.1 Architecture frontend

Nuxt 4 gère l'application web et Vue 3 gère les composants et l'état de l'interface.

Three.js est utilisé pour le rendu 3D de l'arène.

L'application doit séparer clairement :

- L'interface utilisateur.
- La communication réseau.
- La scène 3D.
- L'état local de l'interface.

## 6.2 Pages principales

Pages prévues :

| Route          | Fonction                             |
| -------------- | ------------------------------------ |
| `/`            | Accueil                              |
| `/play`        | Choix du mode de jeu                 |
| `/matchmaking` | Recherche d'un adversaire            |
| `/room/:code`  | Rejoindre ou afficher un salon privé |
| `/game/:id`    | Interface de partie                  |
| `/profile`     | Profil et statistiques               |

Les routes peuvent être adaptées pendant l'implémentation, sans modifier les règles de gameplay.

## 6.3 Composants frontend

Composants principaux envisagés :

```text
components/
├── game/
│   ├── GameCanvas.vue
│   ├── GameHUD.vue
│   ├── PlayerStatus.vue
│   ├── TurnTimer.vue
│   ├── ActionSelector.vue
│   ├── MovementControls.vue
│   ├── AttackControls.vue
│   └── TurnResult.vue
│
├── lobby/
│   ├── QuickMatch.vue
│   ├── CreatePrivateRoom.vue
│   └── JoinPrivateRoom.vue
│
└── ui/
    ├── AppButton.vue
    ├── AppModal.vue
    └── LoadingIndicator.vue
```

Cette liste est indicative et peut évoluer.

## 6.4 Gestion de l'état frontend

Vue 3 et ses composables natifs doivent être privilégiés.

Les composables doivent séparer les responsabilités.

Exemples :

- `useGameRoom()` : connexion et communication avec une room.
- `useGameState()` : état public de la partie.
- `usePlayerAction()` : sélection de l'action locale.
- `useMatchmaking()` : recherche d'un adversaire.
- `usePrivateRoom()` : création et accès aux salons privés.

Une bibliothèque d'état supplémentaire ne doit être ajoutée que si un besoin concret le justifie.

## 6.5 Three.js

Three.js est utilisé pour construire et afficher la scène 3D.

Le rendu 3D doit être isolé dans un composant ou un module dédié.

Le composant principal est `GameCanvas.vue`.

Il est responsable de :

- L'initialisation du renderer.
- La création de la scène.
- La création de la caméra.
- La création de l'arène.
- La création des personnages.
- La mise à jour des positions.
- Les animations visuelles.
- La destruction propre des ressources.

## 6.6 Compatibilité Nuxt et SSR

Three.js nécessite un environnement navigateur.

La scène 3D ne doit donc pas être initialisée pendant le rendu serveur de Nuxt.

Le composant de jeu doit être chargé uniquement côté client.

Les accès à `window`, `document`, WebGL et aux API navigateur doivent rester dans du code exécuté côté client.

## 6.7 Scène 3D

La scène comprend :

- Une caméra en perspective isométrique ou quasi isométrique.
- Une lumière principale.
- Un éclairage d'ambiance.
- Une plateforme hexagonale.
- Deux capsules représentant les joueurs.
- Des effets visuels simples pour les attaques.
- Des indicateurs visuels de déplacement et de portée.

Les éléments graphiques doivent rester lisibles et peu coûteux à rendre.

## 6.8 Coordonnées

Le monde du jeu utilise un plan horizontal X/Z.

L'axe Y représente la hauteur.

Les positions transmises par le serveur utilisent des coordonnées cohérentes avec ce repère.

Le frontend convertit ces positions en objets Three.js sans modifier les données de référence.

---

# 7. Backend — Node.js et Colyseus

## 7.1 Architecture

Le backend utilise Node.js avec TypeScript.

Colyseus gère les connexions, les rooms et la synchronisation de l'état.

La logique métier doit rester séparée des classes Colyseus.

## 7.2 Organisation du serveur

```text
server/src/
├── rooms/
│   ├── GameRoom.ts
│   ├── GameRoomState.ts
│   └── RoomFactory.ts
│
├── matchmaking/
│   ├── QuickMatchService.ts
│   └── PrivateRoomService.ts
│
├── auth/
│   ├── GuestAuthService.ts
│   └── TokenService.ts
│
├── services/
│   ├── GameService.ts
│   ├── PlayerService.ts
│   └── ResultService.ts
│
├── database/
│   ├── client.ts
│   ├── schema/
│   └── migrations/
│
├── config/
│   └── env.ts
│
└── index.ts
```

## 7.3 GameRoom

Chaque partie est représentée par une instance de `GameRoom`.

Elle gère :

- L'entrée et la sortie des joueurs.
- L'état du salon.
- Le cycle des tours.
- La réception des actions.
- Le compte à rebours.
- La résolution du tour.
- La diffusion des résultats.
- La reconnexion.

La room ne doit pas contenir directement tous les calculs géométriques et de combat.

Elle appelle les fonctions du package `game-logic`.

## 7.4 GameRoomState

L'état synchronisé Colyseus doit contenir uniquement les informations publiques nécessaires aux deux joueurs.

Exemples :

- Numéro du tour.
- État de la partie.
- Positions publiques.
- Points de vie.
- Présence des joueurs.
- Temps restant ou échéance du tour.
- Dernier résultat public.

Les actions secrètes ne doivent jamais être stockées dans cet état synchronisé.

Elles sont conservées dans une structure privée côté serveur.

## 7.5 Autorité serveur

Le serveur doit recalculer les résultats à partir de l'état de jeu et des actions validées.

Aucune donnée de résultat envoyée par le client ne doit être considérée comme fiable.

---

# 8. Logique de jeu — packages/game-logic

## 8.1 Principe

La logique de jeu doit être déterministe et indépendante du moteur graphique.

Elle reçoit un état initial et des actions validées.

Elle retourne un nouvel état et les événements produits pendant la résolution.

Elle ne doit pas effectuer d'accès réseau, de requête SQL ou de manipulation du DOM.

## 8.2 Organisation

```text
game-logic/src/
├── arena/
│   ├── arenaBounds.ts
│   └── positionValidation.ts
│
├── movement/
│   ├── calculateMovement.ts
│   └── resolveMovement.ts
│
├── collision/
│   └── resolvePlayerCollision.ts
│
├── combat/
│   ├── calculateAttack.ts
│   ├── calculateAngle.ts
│   └── calculateDamage.ts
│
├── turns/
│   ├── resolveTurn.ts
│   └── determineWinner.ts
│
├── simulation/
│   └── gameSimulation.ts
│
└── index.ts
```

## 8.3 Modèle de données

Le modèle de jeu doit être indépendant des structures de synchronisation Colyseus.

Exemple conceptuel :

```ts
type Vector2 = {
  x: number;
  z: number;
};

type PlayerState = {
  id: string;
  seat: 0 | 1;
  position: Vector2;
  orientation: number;
  hp: number;
  isAlive: boolean;
};

type GameState = {
  turnNumber: number;
  status: "selecting" | "resolving" | "finished";
  players: [PlayerState, PlayerState];
};
```

Les types définitifs doivent être centralisés dans les packages appropriés.

## 8.4 Déplacements

Le moteur de jeu doit :

1. Vérifier la direction.
2. Vérifier la distance.
3. Calculer la destination.
4. Vérifier les limites de l'arène.
5. Calculer les deux destinations avant d'appliquer les déplacements.
6. Vérifier le chevauchement des positions finales.
7. Appliquer les déplacements simultanément ou annuler les deux si les destinations se chevauchent.

Les trajectoires peuvent se croiser si les positions finales ne se chevauchent pas.

## 8.5 Arène hexagonale

L'arène est représentée par un hexagone régulier.

Le système de validation doit vérifier qu'une position se trouve à l'intérieur de l'arène.

La fonction de validation doit être indépendante du rendu graphique.

La géométrie utilisée par le serveur constitue la référence.

## 8.6 Collisions

Les personnages sont représentés par des capsules visuellement, mais leur collision peut être simplifiée par un cercle dans le plan X/Z.

Le rayon de collision doit être défini dans la configuration du gameplay.

Le calcul doit être cohérent entre les deux personnages.

Une collision finale est considérée comme valide uniquement si les volumes de collision ne se chevauchent pas.

La valeur exacte du rayon de collision reste à définir dans la configuration technique du gameplay.

## 8.7 Attaques

Le calcul des attaques doit utiliser les positions finales après déplacement.

Le serveur vérifie :

- La portée entre les centres des personnages.
- L'angle entre la direction d'attaque et le vecteur vers la cible.
- L'état vivant de l'attaquant.
- L'état de la partie.

Les valeurs de portée, d'angle et de dégâts proviennent d'une configuration centralisée.

## 8.8 Déterminisme

Pour un même état initial et les mêmes actions, la logique de jeu doit toujours produire le même résultat.

Les fonctions de jeu ne doivent pas dépendre :

- De l'heure système.
- De valeurs aléatoires non contrôlées.
- De l'ordre d'exécution des animations.
- De l'état du navigateur.
- De données non validées.

---

# 9. Communication réseau

## 9.1 Messages client vers serveur

Les messages doivent être typés et validés.

Messages prévus :

| Message              | Fonction                            |
| -------------------- | ----------------------------------- |
| `submit_action`      | Soumettre une action                |
| `cancel_matchmaking` | Annuler une recherche               |
| `request_room_info`  | Demander des informations publiques |
| `ping`               | Vérifier la connexion               |

Les messages de connexion, de matchmaking et de salon peuvent également utiliser les mécanismes natifs Colyseus lorsqu'ils sont adaptés.

## 9.2 Messages serveur vers client

| Message               | Fonction                               |
| --------------------- | -------------------------------------- |
| `room_ready`          | Salon prêt                             |
| `turn_started`        | Début du tour                          |
| `action_accepted`     | Action validée pour le joueur concerné |
| `player_ready`        | Indicateur neutre de validation        |
| `turn_revealed`       | Révélation des actions                 |
| `turn_resolved`       | Résultat du tour                       |
| `game_finished`       | Résultat final                         |
| `player_disconnected` | Déconnexion                            |
| `player_reconnected`  | Reconnexion                            |
| `server_error`        | Erreur                                 |

Les messages doivent utiliser des structures versionnées si nécessaire pour faciliter les évolutions futures.

## 9.3 Validation des messages

Les messages entrants doivent être validés avec Zod ou une solution équivalente.

Les schémas de validation doivent être partagés lorsque cela est pertinent.

Le serveur doit rejeter les données malformées avant toute modification de l'état du jeu.

## 9.4 Idempotence

Les actions doivent inclure un identifiant unique de requête ou d'action.

Le serveur doit empêcher qu'une même requête soit exécutée plusieurs fois.

Une action déjà acceptée ne doit pas être rejouée à cause d'une retransmission réseau.

---

# 10. Gestion du temps et synchronisation

## 10.1 Timer serveur

Le compte à rebours est géré exclusivement par le serveur.

La durée d'un tour est de 30 secondes.

Le client affiche le temps restant à partir des informations transmises par le serveur.

Le client ne décide jamais de la fin d'un tour.

## 10.2 Échéance

Le serveur enregistre une échéance pour chaque phase de sélection.

Les actions reçues après cette échéance sont rejetées.

Le serveur doit utiliser une source de temps monotone pour mesurer les durées et éviter les problèmes liés aux changements de l'horloge système.

## 10.3 Expiration

À l'expiration du timer :

- Les actions validées sont conservées.
- Les joueurs n'ayant pas validé reçoivent PASS.
- La phase de sélection est verrouillée.
- La résolution du tour commence.

## 10.4 Ordre de validation

L'ordre de validation est attribué par le serveur au moment de l'acceptation de l'action.

Il ne dépend jamais d'un timestamp fourni par le client.

Une règle de départage déterministe est appliquée en cas d'égalité exacte.

---

# 11. Données et persistance

## 11.1 PostgreSQL

PostgreSQL est utilisé pour conserver les données persistantes.

La base ne doit pas être utilisée pour synchroniser chaque mouvement ou chaque événement visuel en temps réel.

L'état courant d'une partie reste géré en mémoire par le serveur multijoueur.

## 11.2 Drizzle ORM

Drizzle ORM est utilisé pour définir les tables, les relations et les requêtes.

Les migrations doivent être versionnées dans le projet.

Les changements de schéma doivent être reproductibles.

## 11.3 Tables initiales

### players

Informations des joueurs.

Champs envisagés :

- id
- display_name
- created_at
- updated_at

### player_sessions

Sessions invitées et authentification.

Champs envisagés :

- id
- player_id
- token_hash
- created_at
- expires_at
- revoked_at

Le jeton en clair ne doit pas être conservé en base de données.

### matches

Historique des parties.

Champs envisagés :

- id
- player_one_id
- player_two_id
- winner_id
- status
- turn_count
- started_at
- finished_at
- finish_reason

### match_player_results

Résultat individuel de chaque joueur.

Champs envisagés :

- id
- match_id
- player_id
- final_hp
- result

Les structures définitives doivent être établies avant la création des migrations.

## 11.4 Enregistrement des résultats

Les résultats doivent être enregistrés une seule fois.

L'enregistrement doit être protégé contre les doublons.

Les opérations d'écriture liées à la fin d'une partie doivent être transactionnelles lorsque plusieurs tables sont concernées.

---

# 12. Authentification et sécurité

## 12.1 Sessions invitées

Le MVP utilise un système de sessions invitées.

Chaque session est identifiée par un jeton sécurisé.

Le serveur vérifie le jeton avant d'autoriser l'accès à un salon.

## 12.2 Variables d'environnement

Les secrets ne doivent jamais être intégrés au code source.

Un fichier `.env.example` doit documenter les variables nécessaires.

Exemples :

```env
NODE_ENV=development

WEB_URL=http://localhost:3000
SERVER_PORT=2567

DATABASE_URL=postgresql://...

SESSION_SECRET=replace_me

COLYSEUS_PUBLIC_URL=ws://localhost:2567
```

Les valeurs de production doivent être configurées dans l'environnement de déploiement.

Le fichier `.env` ne doit jamais être ajouté à Git.

## 12.3 Validation des entrées

Toutes les entrées provenant du client sont considérées comme non fiables.

Le serveur doit contrôler :

- Les identifiants.
- Les jetons.
- Les codes de salon.
- Les types d'actions.
- Les valeurs numériques.
- Les limites géométriques.
- Les messages réseau.

## 12.4 Transport

En production, l'application doit utiliser HTTPS et WSS.

Les connexions non sécurisées ne doivent être autorisées que dans l'environnement local de développement.

---

# 13. Configuration du jeu

Les paramètres du gameplay doivent être centralisés.

Exemple conceptuel :

```ts
export const GAME_CONFIG = {
  maxHp: 100,
  turnDurationMs: 30_000,
  maxTurns: 30,
  arenaRadius: 12,
  maxMoveDistance: 3,

  collisionRadius: 0, // Valeur à définir avant implémentation

  attacks: {
    sweep: {
      range: 2,
      angle: 180,
      damage: 25,
    },
    strike: {
      range: 5,
      angle: 90,
      damage: 30,
    },
    sniper: {
      range: 12,
      angle: 10,
      damage: 40,
    },
  },

  reconnectGracePeriodMs: 30_000,
  privateRoomExpirationMs: 600_000,
};
```

La valeur `collisionRadius` est un emplacement à compléter, et non une valeur de gameplay validée.

Les composants frontend peuvent consulter les paramètres nécessaires à l'affichage, mais le serveur reste la référence pour leur application.

Les paramètres critiques ne doivent jamais être contrôlables par le client.

---

# 14. Gestion des erreurs et journalisation

## 14.1 Logs

Le serveur doit produire des logs structurés.

Les événements importants doivent pouvoir être identifiés :

- Création d'un salon.
- Entrée d'un joueur.
- Début d'une partie.
- Validation d'une action.
- Résolution d'un tour.
- Fin d'une partie.
- Déconnexion.
- Reconnexion.
- Erreur serveur.

## 14.2 Informations sensibles

Les logs ne doivent pas contenir :

- Les jetons d'authentification en clair.
- Les secrets.
- Les informations privées inutiles.
- Les données personnelles non nécessaires.

Les actions secrètes ne doivent pas être exposées dans les logs accessibles au client.

## 14.3 Gestion des erreurs

Les erreurs doivent être traitées de façon centralisée.

Une erreur inattendue ne doit pas laisser une partie dans un état incohérent.

Le serveur doit prévoir une stratégie de gestion des erreurs de résolution et de persistance.

---

# 15. Tests et qualité du code

## 15.1 Vitest

Vitest est utilisé pour les tests unitaires et d'intégration.

Les tests de logique de jeu doivent être prioritaires.

Ils doivent être indépendants du navigateur.

## 15.2 Tests de game-logic

Les scénarios suivants doivent être testés :

- Déplacement dans chaque direction.
- Déplacement à distance maximale.
- Déplacement hors arène.
- Chevauchement des positions finales.
- Croisement des trajectoires.
- Calcul de portée.
- Calcul d'angle.
- Attaque valide.
- Attaque hors portée.
- Attaque hors angle.
- Priorité des attaques.
- Élimination.
- Match nul.
- Fin après 30 tours.

## 15.3 Tests backend

Les tests backend doivent couvrir :

- Création de room.
- Rejoindre une room.
- Quick Match.
- Private Room.
- Validation des actions.
- Expiration du timer.
- Déconnexion.
- Reconnexion.
- Protection contre les doublons.
- Enregistrement des résultats.

## 15.4 Playwright

Playwright est utilisé pour les tests navigateur.

Les scénarios prioritaires :

- Ouverture de l'application.
- Création d'une session invitée.
- Création d'un salon privé.
- Rejoindre un salon privé avec un second client.
- Démarrage d'une partie.
- Sélection et validation d'une action.
- Affichage du résultat d'un tour.
- Fin d'une partie.

Les tests multijoueurs doivent utiliser deux contextes navigateur indépendants.

## 15.5 TypeScript

Le projet doit utiliser TypeScript en mode strict.

Les types `any` doivent être évités.

Les types partagés doivent être centralisés.

Les erreurs de typage doivent être corrigées avant validation d'une fonctionnalité.

---

# 16. Performance

## 16.1 Frontend

Le rendu 3D doit rester fluide sur les navigateurs modernes.

Les ressources Three.js doivent être libérées correctement.

Les animations ne doivent pas créer de traitements réseau inutiles.

Les mises à jour visuelles doivent être séparées des mises à jour de l'état de jeu.

## 16.2 Backend

La logique de jeu doit rester légère.

Les calculs géométriques doivent être réalisés uniquement lorsque nécessaire.

Les timers doivent être gérés côté serveur sans créer de boucles inutiles par joueur.

Le serveur doit pouvoir gérer plusieurs salons indépendants.

## 16.3 Réseau

Seules les informations nécessaires doivent être transmises.

Les animations ne doivent pas générer de messages réseau à chaque frame.

Les messages doivent correspondre à des événements ou à des changements d'état utiles.

---

# 17. Développement local

## 17.1 Environnement

Le développement local nécessite :

- Node.js LTS compatible avec les dépendances.
- pnpm.
- Git.
- Un éditeur de code.
- PostgreSQL local ou une instance accessible.

## 17.2 Commandes prévues

Installation :

```bash
pnpm install
```

Démarrage frontend et backend :

```bash
pnpm dev
```

Démarrage séparé :

```bash
pnpm dev:web
pnpm dev:server
```

Tests :

```bash
pnpm test
pnpm test:e2e
```

Vérifications :

```bash
pnpm typecheck
pnpm lint
```

Les scripts doivent être configurés dans les `package.json` concernés.

## 17.3 Configuration locale

Le frontend et le serveur doivent pouvoir fonctionner séparément.

Le serveur doit être accessible depuis le frontend via une URL configurable.

La configuration locale ne doit pas être codée en dur dans les composants.

---

# 18. Déploiement

## 18.1 Architecture de production

Le déploiement doit permettre de séparer :

- L'application web.
- Le serveur multijoueur.
- La base PostgreSQL.

Le serveur multijoueur doit être accessible publiquement via WebSocket sécurisé.

## 18.2 Environnements

Trois environnements sont prévus :

| Environnement | Usage                           |
| ------------- | ------------------------------- |
| Development   | Développement local             |
| Staging       | Tests avant publication         |
| Production    | Jeu accessible aux utilisateurs |

Chaque environnement doit avoir sa propre configuration.

## 18.3 Base de données

Les migrations doivent être exécutées de manière contrôlée.

Les données de production ne doivent pas être supprimées lors d'un déploiement.

Des sauvegardes régulières doivent être prévues.

## 18.4 Évolutivité

L'architecture doit permettre d'ajouter ultérieurement plusieurs instances du serveur multijoueur.

Toutefois, le déploiement initial peut utiliser une seule instance de serveur.

La mise à l'échelle distribuée n'est pas un objectif du MVP.

---

# 19. Règles de développement pour l'agent IA

L'agent IA chargé du développement doit respecter les règles suivantes :

1. Lire les documents du dossier `docs/` avant de commencer une fonctionnalité.
2. Respecter la stack technique définie dans ce document.
3. Ne pas ajouter Turborepo.
4. Ne pas remplacer Three.js par un moteur 2D.
5. Maintenir une séparation claire entre frontend, backend et logique de jeu.
6. Ne pas placer la logique métier dans les composants Vue.
7. Ne pas placer les calculs de gameplay directement dans les rooms Colyseus.
8. Ne jamais faire confiance aux résultats calculés par le client.
9. Ne jamais exposer les actions secrètes dans l'état synchronisé.
10. Écrire des tests pour chaque fonctionnalité importante.
11. Utiliser TypeScript strict.
12. Valider les entrées réseau.
13. Éviter les dépendances inutiles.
14. Ne pas ajouter de fonctionnalités hors périmètre du MVP sans validation.
15. Documenter les décisions techniques importantes dans `DECISIONS.md`.
16. Ne pas modifier une règle de gameplay sans mettre à jour les documents correspondants.

L'agent doit procéder progressivement, en privilégiant des fonctionnalités petites, testables et vérifiables.

---

# 20. Critères de validation technique

L'architecture technique est considérée comme correctement mise en place lorsque :

- Le monorepo pnpm fonctionne.
- Le frontend Nuxt démarre.
- Le serveur Node.js démarre.
- Colyseus accepte des connexions.
- Les deux packages partagés sont importables.
- Three.js affiche une scène 3D.
- La logique de jeu peut être testée indépendamment.
- Les messages réseau sont typés et validés.
- Les actions secrètes restent côté serveur.
- PostgreSQL est accessible.
- Drizzle ORM peut exécuter les migrations.
- Vitest exécute les tests.
- Playwright peut exécuter les tests navigateur.
- Les commandes de vérification TypeScript et lint fonctionnent.

**Fin du document — HEX DUEL TECHNICAL SPECIFICATION v0.1**

---

# 21. Système de bonus sur l'arène

## 21.1 Logique pure (packages/game-logic)

- `src/bonus/bonusPlanning.ts` : générateur déterministe du planning. Un PRNG seedé (mulberry32) tire les quantités (régénération 1-2, attaque 4-5, déplacement 4-6, bouclier 3), puis les tours d'apparition (distincts, dans la fenêtre 2-22, un maximum par tour ; le premier spawn n'est jamais une régénération). Même seed → même planning.
- `src/bonus/resolveBonuses.ts` : spawn du tour (position équitable calculée au tour du spawn avec le même seed), expiration après 2 tours au sol, détection de ramassage (position finale, trajectoire — distance segment/point —, zone d'attaque), gestion de l'emplacement unique, de la régénération plafonnée à 3 cristaux, de l'absorption du bouclier et du double ramassage simultané.
- `resolveTurn` accepte un contexte de bonus optionnel : sans contexte, le comportement est strictement identique à avant (aucun impact sur les parties sans bonus).

## 21.2 Valeurs boostées

Les valeurs boostées vivent dans `@hex-duel/shared` (BONUS_CONFIG) : déplacement 5 → 7 ; STRIKE 6/90° → 8/180° ; SNIPER 10/10° → 12/25°. Un bonus armé est consommé par la prochaine action concernée (une seule).

## 21.3 Serveur (apps/server)

- Le seed est généré côté serveur au démarrage de la partie et n'est jamais envoyé au client.
- L'état Colyseus public expose : les bonus au sol (type, position, tour d'apparition) et le bonus armé de chaque joueur. Ce sont des données publiques ; seules les actions restent secrètes (D-134).
- Le serveur reste l'unique autorité : validation, résolution, consommation, expiration.

## 21.4 Client (apps/web)

- Les bonus au sol sont rendus en 3D (modèles `bonus-*.glb`) en lévitation au-dessus de l'arène, avec un marqueur au sol coloré.
- Le HUD affiche l'icône 2D du bonus armé sous le nom du joueur qui le porte.
- La régénération remplace le dernier cristal perdu par le cristal vert dans l'affichage du joueur.
