# HEX DUEL — DECISION LOG

**Version :** 1.0  
**Statut :** Référence des décisions du projet  
**Dernière mise à jour :** 31 octobre 2026

---

# 1. Objectif

Ce document centralise les décisions importantes prises pendant la conception et le développement de HEX DUEL.

Il constitue une référence pour les développeurs et les agents IA travaillant sur le projet.

Ses objectifs sont de :

- Éviter les contradictions entre les documents.
- Empêcher la remise en question involontaire des décisions validées.
- Conserver une trace des choix techniques et fonctionnels.
- Identifier les sujets qui nécessitent encore un arbitrage.
- Faciliter les évolutions futures du projet.

## 1.1 Statuts des décisions

Chaque décision possède l'un des statuts suivants :

| Statut     | Signification                    |
| ---------- | -------------------------------- |
| ACCEPTED   | Décision validée et à respecter  |
| PROPOSED   | Proposition à confirmer          |
| PENDING    | Décision non encore prise        |
| SUPERSEDED | Décision remplacée par une autre |

Une décision ACCEPTED ne doit pas être modifiée sans validation explicite.

---

# 2. Vision et périmètre du projet

| ID    | Décision                                                                                   | Statut   |
| ----- | ------------------------------------------------------------------------------------------ | -------- |
| D-001 | HEX DUEL est un jeu multijoueur en ligne strictement 1 contre 1.                           | ACCEPTED |
| D-002 | Le jeu est accessible depuis un navigateur web.                                            | ACCEPTED |
| D-003 | Le MVP comprend un matchmaking aléatoire et des salons privés.                             | ACCEPTED |
| D-004 | Le MVP utilise une seule arène hexagonale sans obstacles.                                  | ACCEPTED |
| D-005 | Les fonctionnalités hors périmètre du MVP ne doivent pas être développées sans validation. | ACCEPTED |
| D-006 | Le jeu utilise de véritables graphismes 3D.                                                | ACCEPTED |

---

# 3. Décisions de gameplay

## 3.1 Structure des parties

| ID    | Décision                                             | Statut   |
| ----- | ---------------------------------------------------- | -------- |
| D-010 | Deux joueurs exactement par partie.                  | ACCEPTED |
| D-011 | Chaque joueur commence avec 100 HP.                  | PROPOSED |
| D-012 | Chaque tour dispose d'un timer de 30 secondes.       | ACCEPTED |
| D-013 | Une partie comporte au maximum 30 tours.             | PROPOSED |
| D-014 | Le rayon de l'arène est de 12 unités.                | PROPOSED |
| D-015 | La distance maximale de déplacement est de 3 unités. | ACCEPTED |

Les valeurs numériques de gameplay constituent la configuration de référence initiale du GDD. Elles pourront être ajustées après les premiers tests d'équilibrage.

## 3.2 Actions disponibles

| ID    | Décision                                                               | Statut   |
| ----- | ---------------------------------------------------------------------- | -------- |
| D-020 | Les actions disponibles sont MOVE, SWEEP, STRIKE, SNIPER et PASS.      | ACCEPTED |
| D-021 | Un joueur choisit une seule action par tour.                           | ACCEPTED |
| D-022 | Les actions restent secrètes jusqu'à la résolution.                    | ACCEPTED |
| D-023 | Une action doit être validée pour être enregistrée.                    | ACCEPTED |
| D-024 | Une action non validée à la fin du timer devient automatiquement PASS. | ACCEPTED |

## 3.3 Déplacements

| ID    | Décision                                                                                       | Statut   |
| ----- | ---------------------------------------------------------------------------------------------- | -------- |
| D-030 | Les déplacements sont libres sur 360 degrés.                                                   | ACCEPTED |
| D-031 | Les deux déplacements sont calculés à partir des positions initiales du tour.                  | ACCEPTED |
| D-032 | Les déplacements sont résolus avant les attaques.                                              | ACCEPTED |
| D-033 | Les déplacements sont appliqués simultanément.                                                 | ACCEPTED |
| D-034 | Les trajectoires peuvent se croiser si les positions finales ne se chevauchent pas.            | ACCEPTED |
| D-035 | Si les deux positions finales provoquent un chevauchement, les deux déplacements sont annulés. | ACCEPTED |
| D-036 | L'orientation du personnage est indépendante de son déplacement.                               | ACCEPTED |

## 3.4 Attaques

| ID    | Décision                                                        | Statut   |
| ----- | --------------------------------------------------------------- | -------- |
| D-040 | Les attaques sont directionnelles.                              | ACCEPTED |
| D-041 | La direction d'attaque est indépendante du déplacement.         | ACCEPTED |
| D-042 | Les portées sont calculées entre les centres des personnages.   | ACCEPTED |
| D-043 | Les angles d'attaque sont calculés dans le plan horizontal X/Z. | ACCEPTED |
| D-044 | Les attaques utilisent les positions finales après déplacement. | ACCEPTED |

### Paramètres des attaques

| Attaque | Portée | Angle total | Dégâts | Statut   |
| ------- | -----: | ----------: | -----: | -------- |
| SWEEP   |      2 |        180° |     25 | PROPOSED |
| STRIKE  |      5 |         90° |     30 | PROPOSED |
| SNIPER  |     12 |         10° |     40 | PROPOSED |

Ces valeurs sont les paramètres de référence du GDD, à confirmer par les tests d'équilibrage.

## 3.5 Priorité des attaques

| ID    | Décision                                                                                     | Statut   |
| ----- | -------------------------------------------------------------------------------------------- | -------- |
| D-050 | Les attaques sont résolues séquentiellement.                                                 | ACCEPTED |
| D-051 | Le joueur ayant validé son action en premier possède la priorité.                            | ACCEPTED |
| D-052 | L'ordre de validation est déterminé par le serveur.                                          | ACCEPTED |
| D-053 | En cas d'égalité exacte, un départage déterministe basé sur le siège du joueur est appliqué. | ACCEPTED |
| D-054 | Si la première attaque élimine son adversaire, la seconde attaque n'est pas exécutée.        | ACCEPTED |

---

# 4. Décisions multijoueurs

## 4.1 Architecture réseau

| ID    | Décision                                                             | Statut   |
| ----- | -------------------------------------------------------------------- | -------- |
| D-060 | Architecture client-serveur.                                         | ACCEPTED |
| D-061 | Le serveur est l'unique autorité sur l'état et les résultats du jeu. | ACCEPTED |
| D-062 | Communication via WebSockets.                                        | ACCEPTED |
| D-063 | Colyseus gère les rooms et la synchronisation multijoueur.           | ACCEPTED |
| D-064 | Chaque partie possède son propre salon.                              | ACCEPTED |
| D-065 | Un salon accepte exactement deux joueurs.                            | ACCEPTED |
| D-066 | Aucun spectateur dans le MVP.                                        | ACCEPTED |

## 4.2 Matchmaking

| ID    | Décision                                                           | Statut   |
| ----- | ------------------------------------------------------------------ | -------- |
| D-070 | Un système Quick Match est disponible.                             | ACCEPTED |
| D-071 | Un joueur peut créer un salon privé.                               | ACCEPTED |
| D-072 | Un joueur peut rejoindre un salon privé avec un code d'invitation. | ACCEPTED |
| D-073 | Les salons privés ne sont pas accessibles via Quick Match.         | ACCEPTED |
| D-074 | Le code d'invitation est généré par le serveur.                    | ACCEPTED |

## 4.3 Identification

| ID    | Décision                                                              | Statut   |
| ----- | --------------------------------------------------------------------- | -------- |
| D-080 | Le MVP utilise un système d'identification invité.                    | ACCEPTED |
| D-081 | Les comptes utilisateurs complets ne sont pas obligatoires.           | ACCEPTED |
| D-082 | Chaque joueur possède un identifiant et un jeton de session sécurisé. | ACCEPTED |
| D-083 | Les jetons ne sont jamais exposés à l'adversaire.                     | ACCEPTED |

## 4.4 Déconnexion

| ID    | Décision                                                                          | Statut   |
| ----- | --------------------------------------------------------------------------------- | -------- |
| D-090 | Une déconnexion ne provoque pas immédiatement la fin de la partie.                | ACCEPTED |
| D-091 | Le délai de reconnexion de référence est de 30 secondes.                          | PROPOSED |
| D-092 | Une déconnexion prolongée entraîne une défaite par abandon.                       | ACCEPTED |
| D-093 | Une action déjà validée ne peut pas être remplacée après reconnexion.             | ACCEPTED |
| D-094 | Une action non validée devient PASS à l'expiration du timer, conformément au GDD. | ACCEPTED |
| D-095 | Un joueur peut abandonner volontairement via un bouton dédié (drapeau blanc) avec confirmation. L'abandon met fin à la partie immédiatement et déclare l'adversaire vainqueur. | ACCEPTED |

---

# 5. Décisions techniques

## 5.1 Stack technique

| ID    | Décision                                          | Statut   |
| ----- | ------------------------------------------------- | -------- |
| D-100 | Nuxt 4 pour l'application web.                    | ACCEPTED |
| D-101 | Vue 3 pour l'interface utilisateur.               | ACCEPTED |
| D-102 | Three.js pour le rendu 3D.                        | ACCEPTED |
| D-103 | Node.js pour le serveur.                          | ACCEPTED |
| D-104 | TypeScript pour le frontend et le backend.        | ACCEPTED |
| D-105 | Colyseus pour le multijoueur.                     | ACCEPTED |
| D-106 | PostgreSQL pour la persistance.                   | ACCEPTED |
| D-107 | Drizzle ORM pour l'accès aux données.             | ACCEPTED |
| D-108 | Zod pour la validation des données.               | ACCEPTED |
| D-109 | Vitest pour les tests unitaires et d'intégration. | ACCEPTED |
| D-110 | Playwright pour les tests navigateur.             | ACCEPTED |

## 5.2 Organisation du projet

| ID    | Décision                                                        | Statut   |
| ----- | --------------------------------------------------------------- | -------- |
| D-120 | Le projet utilise un monorepo.                                  | ACCEPTED |
| D-121 | pnpm Workspaces est utilisé pour gérer le monorepo.             | ACCEPTED |
| D-122 | Le projet est organisé en applications et packages partagés.    | ACCEPTED |
| D-123 | Un package shared centralise les types et schémas communs.      | ACCEPTED |
| D-124 | Un package game-logic contient la logique pure du jeu.          | ACCEPTED |
| D-125 | Turborepo n'est pas utilisé.                                    | ACCEPTED |
| D-126 | Les dépendances internes utilisent les noms de packages dédiés. | ACCEPTED |

## 5.3 Séparation des responsabilités

| ID    | Décision                                                                  | Statut   |
| ----- | ------------------------------------------------------------------------- | -------- |
| D-130 | Le frontend ne décide jamais du résultat d'une action.                    | ACCEPTED |
| D-131 | La logique métier est séparée des composants Vue.                         | ACCEPTED |
| D-132 | La logique de jeu est indépendante de Three.js.                           | ACCEPTED |
| D-133 | Les calculs de gameplay sont exécutés côté serveur.                       | ACCEPTED |
| D-134 | Les actions secrètes ne sont jamais incluses dans l'état Colyseus public. | ACCEPTED |

---

# 6. Décisions UI/UX

## 6.1 Direction artistique

| ID    | Décision                                                         | Statut   |
| ----- | ---------------------------------------------------------------- | -------- |
| D-140 | Style graphique minimaliste.                                     | ACCEPTED |
| D-141 | Interface sombre et épurée.                                      | ACCEPTED |
| D-142 | Joueur 1 identifié en rouge.                                     | ACCEPTED |
| D-143 | Joueur 2 identifié en bleu.                                      | ACCEPTED |
| D-144 | Les capsules sont les représentations visuelles des personnages. | ACCEPTED |

## 6.2 Caméra et contrôles

| ID    | Décision                                                                    | Statut   |
| ----- | --------------------------------------------------------------------------- | -------- |
| D-150 | Caméra isométrique fixe.                                                    | ACCEPTED |
| D-151 | Le joueur utilise la souris pour contrôler les déplacements sur ordinateur. | ACCEPTED |
| D-152 | Le joueur utilise la souris pour orienter les attaques sur ordinateur.      | ACCEPTED |
| D-153 | Les déplacements et les attaques sont contrôlés indépendamment.             | ACCEPTED |
| D-154 | L'arène entière doit rester lisible dans le champ de la caméra.             | ACCEPTED |

## 6.3 Langues

| ID    | Décision                                                                                       | Statut   |
| ----- | ---------------------------------------------------------------------------------------------- | -------- |
| D-160 | L'interface est disponible en français et en anglais dès le MVP.                               | ACCEPTED |
| D-161 | La langue peut être choisie manuellement.                                                      | ACCEPTED |
| D-162 | La langue initiale peut être déterminée par les préférences du navigateur.                     | ACCEPTED |
| D-163 | L'anglais est utilisé par défaut si la langue du navigateur n'est ni le français ni l'anglais. | ACCEPTED |
| D-164 | Tous les textes visibles doivent utiliser le système centralisé de traduction.                 | ACCEPTED |

## 6.4 Plateformes

| ID    | Décision                                                    | Statut   |
| ----- | ----------------------------------------------------------- | -------- |
| D-170 | Le desktop est la plateforme prioritaire du MVP.            | ACCEPTED |
| D-171 | L'interface doit être adaptée aux tablettes et smartphones. | ACCEPTED |
| D-172 | Des contrôles tactiles doivent être prévus pour mobile.     | ACCEPTED |

---

# 7. Persistance et données

| ID    | Décision                                                                                     | Statut   |
| ----- | -------------------------------------------------------------------------------------------- | -------- |
| D-180 | PostgreSQL conserve les données persistantes.                                                | ACCEPTED |
| D-181 | Les statistiques de base sont conservées.                                                    | ACCEPTED |
| D-182 | Les résultats des parties sont enregistrés après leur fin.                                   | ACCEPTED |
| D-183 | L'enregistrement des résultats doit éviter les doublons.                                     | ACCEPTED |
| D-184 | La synchronisation temps réel ne repose pas sur des écritures SQL à chaque événement visuel. | ACCEPTED |
| D-185 | L'historique détaillé de toutes les actions n'est pas obligatoire pour le MVP.               | ACCEPTED |

---

# 8. Paramètres restant à définir

Les points suivants nécessitent encore une décision ou une précision technique.

| ID    | Sujet                                                           | État actuel           |
| ----- | --------------------------------------------------------------- | --------------------- |
| P-001 | Rayon de collision des capsules                                 | PENDING               |
| P-002 | Orientation exacte de l'hexagone                                | PENDING               |
| P-003 | Formule géométrique définitive de validation de l'arène         | PENDING               |
| P-004 | Règle précise de départage entre les sièges 0 et 1              | PENDING               |
| P-005 | Valeurs définitives des dégâts et des portées après équilibrage | PROPOSED              |
| P-006 | Valeurs définitives des paramètres généraux du gameplay         | PROPOSED              |
| P-007 | Durée d'expiration des salons privés                            | PROPOSED : 10 minutes |
| P-008 | Politique définitive de conservation des sessions invitées      | PENDING               |
| P-009 | Hébergement et fournisseur de déploiement                       | PENDING               |
| P-010 | Politique de sauvegarde PostgreSQL en production                | PENDING               |

Aucune valeur PENDING ne doit être inventée ou considérée comme définitivement validée par l'agent IA.

L'agent peut proposer une solution technique, mais doit signaler les arbitrages nécessaires.

---

# 9. Règles de gestion des décisions

## 9.1 Ajout d'une décision

Toute décision importante doit être ajoutée à ce document.

Elle doit comporter :

- Un identifiant unique.
- Une description claire.
- Un statut.
- Une catégorie.

## 9.2 Modification

Une décision ACCEPTED ne peut pas être modifiée silencieusement.

Pour modifier une décision existante :

1. Identifier la décision concernée.
2. Expliquer la raison du changement.
3. Obtenir une validation.
4. Mettre à jour son statut ou la remplacer.
5. Mettre à jour les documents concernés.

## 9.3 Historique

Les décisions remplacées doivent être conservées dans le document avec le statut SUPERSEDED lorsque leur historique reste utile.

## 9.4 Cohérence documentaire

Toute modification doit être répercutée dans les documents concernés :

- `GAME_DESIGN.md`
- `MULTIPLAYER_SPEC.md`
- `TECHNICAL_SPEC.md`
- `UI_UX_SPEC.md`
- `AGENTS.md`

Le présent document constitue le registre central des décisions.

Les spécifications détaillées restent les documents de référence pour leur domaine respectif.

---

# 10. Instructions destinées à l'agent IA

L'agent IA doit :

1. Lire `DECISIONS.md` avant de commencer une tâche.
2. Respecter toutes les décisions ACCEPTED.
3. Ne pas modifier une décision ACCEPTED sans autorisation.
4. Ne pas transformer une proposition en décision validée.
5. Signaler les contradictions entre documents.
6. Signaler les décisions PENDING qui bloquent une implémentation.
7. Proposer des solutions techniques sans les présenter comme des décisions validées.
8. Mettre à jour ce document lorsqu'une nouvelle décision est explicitement approuvée.
9. Conserver les identifiants des décisions existantes.
10. Éviter les changements d'architecture non justifiés.

---

**Fin du document — HEX DUEL DECISION LOG v1.0**
