# HEX DUEL — MULTIPLAYER SPECIFICATION

**Version :** 0.1  
**Statut :** Draft — à valider  
**Projet :** HEX DUEL  
**Technologies prévues :** Node.js, TypeScript, Colyseus, WebSockets

---

## 1. Objectif du document

Ce document définit l'architecture et les règles de fonctionnement du système multijoueur de HEX DUEL.

Il décrit notamment :

- Le matchmaking aléatoire.
- La création et la gestion des salons privés.
- La connexion et la déconnexion des joueurs.
- La communication entre le client et le serveur.
- La synchronisation des parties.
- La gestion des tours et des actions secrètes.
- La reconnexion après une interruption réseau.
- La sécurité et la prévention de la triche.

Ce document complète le `GAME_DESIGN.md`.

En cas de contradiction, les règles de gameplay définies dans `GAME_DESIGN.md` font référence.

---

## 2. Architecture multijoueur

### 2.1 Principe général

HEX DUEL utilise une architecture client-serveur.

Chaque joueur utilise une application web qui communique avec un serveur de jeu central.

Le serveur est responsable de toutes les décisions importantes concernant une partie.

Les clients ne doivent jamais être considérés comme des sources fiables pour les résultats du jeu.

### 2.2 Technologies

| Élément              | Technologie                            |
| -------------------- | -------------------------------------- |
| Application cliente  | Nuxt 4 / Vue 3                         |
| Langage              | TypeScript                             |
| Communication réseau | WebSockets                             |
| Serveur multijoueur  | Node.js                                |
| Gestion des salons   | Colyseus                               |
| Logique de jeu       | Package partagé et validé côté serveur |
| Base de données      | PostgreSQL                             |
| ORM                  | Drizzle ORM                            |

### 2.3 Responsabilités du client

Le client est responsable de :

- Afficher l'interface utilisateur.
- Afficher l'arène et les personnages en 3D.
- Afficher les informations publiques de la partie.
- Permettre au joueur de sélectionner son action.
- Envoyer les actions au serveur.
- Afficher les résultats transmis par le serveur.
- Gérer les états de connexion et de reconnexion.

Le client ne décide jamais lui-même :

- Si une attaque touche.
- Si un déplacement est valide.
- Si un joueur est éliminé.
- Qui gagne une partie.
- Quand un tour commence ou se termine.
- Quelle action a été validée en premier.

### 2.4 Responsabilités du serveur

Le serveur est responsable de :

- Créer et gérer les salons.
- Affecter les joueurs aux parties.
- Vérifier les actions reçues.
- Gérer le compte à rebours des tours.
- Stocker les actions secrètes.
- Résoudre les déplacements et les attaques.
- Calculer les dégâts et les points de vie.
- Déterminer les résultats des parties.
- Gérer les déconnexions et les reconnexions.
- Transmettre les mises à jour aux clients.

Le serveur constitue l'unique autorité de référence pour l'état d'une partie.

---

## 3. Organisation des salons

### 3.1 Principe

Chaque partie correspond à un salon Colyseus indépendant.

Un salon peut accueillir exactement deux joueurs.

Aucun troisième joueur ne peut rejoindre une partie en cours.

Chaque salon possède un identifiant unique.

### 3.2 Types de salons

Deux types de salons sont prévus.

**Quick Match**

Salon créé automatiquement pour réunir deux joueurs qui souhaitent jouer immédiatement.

**Private Room**

Salon créé par un joueur qui souhaite inviter un autre joueur à l'aide d'un code d'invitation.

### 3.3 Cycle de vie d'un salon

Un salon suit les états suivants :

| État     | Description                     |
| -------- | ------------------------------- |
| WAITING  | En attente d'un deuxième joueur |
| READY    | Deux joueurs présents           |
| IN_GAME  | Partie en cours                 |
| FINISHED | Partie terminée                 |
| DISPOSED | Salon fermé et supprimé         |

Le serveur contrôle toutes les transitions entre ces états.

### 3.4 Capacité

- Capacité maximale : 2 joueurs.
- Capacité minimale pour commencer : 2 joueurs.
- Les spectateurs ne sont pas autorisés dans le MVP.
- Un joueur ne peut pas rejoindre une partie déjà complète.

---

## 4. Quick Match — Matchmaking aléatoire

### 4.1 Objectif

Le Quick Match permet à un joueur de trouver automatiquement un adversaire disponible.

Le joueur n'a pas besoin de connaître l'identité de son adversaire à l'avance.

### 4.2 Fonctionnement

1. Le joueur sélectionne Quick Match.
2. Le client envoie une demande au serveur.
3. Le serveur recherche un salon public disponible avec une place libre.
4. Si un salon existe, le joueur le rejoint.
5. Si aucun salon n'existe, le serveur crée un nouveau salon et y place le joueur.
6. Le serveur attend l'arrivée d'un deuxième joueur.
7. Lorsque deux joueurs sont présents, le salon passe à l'état READY.
8. La partie peut commencer.

### 4.3 Règles de matchmaking

- Un salon Quick Match ne peut accueillir que deux joueurs.
- Un salon complet n'est jamais proposé à un nouveau joueur.
- Un joueur déjà présent dans un salon ne peut pas être ajouté à un deuxième salon actif.
- Un joueur peut annuler sa recherche avant le début de la partie.
- Un salon vide doit être supprimé après un délai d'inactivité défini côté serveur.

### 4.4 Annulation

Si le joueur annule sa recherche :

- Il est retiré de la file d'attente ou du salon d'attente.
- Le serveur confirme l'annulation.
- Si le salon ne contient plus aucun joueur, il est fermé.

### 4.5 Extension future

Le matchmaking par classement ou par niveau de compétence n'est pas prévu dans le MVP.

Le système doit toutefois permettre une évolution future vers un matchmaking basé sur le niveau des joueurs.

---

## 5. Private Room — Salons privés

### 5.1 Création

Un joueur peut créer un salon privé.

Le serveur :

1. Crée un salon avec une capacité de deux joueurs.
2. Génère un code d'invitation unique.
3. Affecte le créateur au premier siège.
4. Retourne le code au client.

### 5.2 Code d'invitation

Le code doit être :

- Généré par le serveur.
- Difficile à deviner.
- Suffisamment court pour être partagé facilement.
- Unique parmi les salons privés actifs.

Une longueur de 6 à 8 caractères alphanumériques est recommandée.

Les caractères ambigus, comme O et 0, peuvent être exclus.

Le code ne doit pas être utilisé comme identifiant interne du salon.

### 5.3 Rejoindre un salon

Le deuxième joueur saisit le code d'invitation.

Le serveur vérifie :

- Que le code existe.
- Que le salon est toujours actif.
- Que le salon n'est pas complet.
- Que le joueur n'est pas déjà présent dans ce salon.
- Que le salon accepte encore les connexions.

Si toutes les vérifications réussissent, le joueur rejoint le salon.

### 5.4 Expiration

Un salon privé vide ou contenant uniquement son créateur ne doit pas rester actif indéfiniment.

Une durée d'expiration doit être définie côté serveur.

Valeur initiale proposée : 10 minutes sans activité.

### 5.5 Confidentialité

Un salon privé ne doit pas apparaître dans la recherche Quick Match.

Seuls les joueurs possédant le code d'invitation peuvent tenter de le rejoindre.

Le code d'invitation ne donne pas accès aux informations internes de la partie.

---

## 6. Identification des joueurs

### 6.1 Principe MVP

Les comptes utilisateurs complets ne sont pas obligatoires pour la première version.

Le système utilise une identification invitée.

Chaque joueur dispose d'un identifiant de session unique.

### 6.2 Identité invitée

Lors de sa première connexion, le client demande au serveur de créer ou de reprendre une session invitée.

Le serveur attribue :

- Un identifiant de joueur.
- Un jeton d'authentification sécurisé.
- Un pseudonyme temporaire ou choisi par le joueur.

### 6.3 Sécurité des jetons

Le jeton d'authentification doit :

- Être généré par le serveur.
- Être suffisamment aléatoire.
- Être transmis uniquement via une connexion sécurisée.
- Ne jamais être exposé à l'autre joueur.
- Être vérifié lors des connexions et reconnexions.

Le client ne doit jamais pouvoir choisir librement l'identifiant interne d'un joueur.

### 6.4 Persistance

Les informations nécessaires à la reprise d'une session peuvent être conservées côté serveur.

Les statistiques de joueur doivent être enregistrées dans PostgreSQL selon les règles de persistance définies dans `TECHNICAL_SPEC.md`.

---

## 7. Connexion et communication

### 7.1 Protocole

La communication entre le client et le serveur utilise WebSockets.

Les messages sont structurés et typés avec TypeScript.

Le protocole doit permettre :

- L'envoi des actions.
- La réception des changements d'état.
- La synchronisation du compte à rebours.
- La réception des événements de jeu.
- La gestion des erreurs.
- La reconnexion.

### 7.2 Connexion

Le client établit une connexion au serveur.

Le serveur vérifie l'identité du joueur et son autorisation à rejoindre le salon demandé.

Si la connexion est acceptée, le serveur transmet l'état public initial de la partie.

### 7.3 Séparation des données publiques et privées

Les données visibles par les deux joueurs doivent être séparées des données privées propres à chaque joueur.

Les informations suivantes sont publiques :

- État du salon.
- Nombre de joueurs présents.
- Numéro du tour.
- Temps restant.
- Positions des personnages.
- Points de vie.
- Résultats des actions après résolution.
- État général de la partie.

Les informations suivantes sont privées :

- Action sélectionnée par le joueur.
- Action validée par le joueur avant résolution.
- Direction d'attaque sélectionnée.
- Destination de déplacement sélectionnée.
- Données internes de validation.

Un joueur ne doit jamais pouvoir accéder à l'action secrète de son adversaire avant la résolution.

### 7.4 Protection des données privées

La logique de synchronisation doit empêcher toute fuite d'information.

En particulier, les actions en attente ne doivent pas être placées dans un état Colyseus automatiquement synchronisé avec les deux clients.

Les actions privées doivent être conservées côté serveur et communiquées uniquement au joueur concerné si une confirmation privée est nécessaire.

---

## 8. Gestion des tours

### 8.1 Début d'un tour

Le serveur :

1. Vérifie que la partie est toujours active.
2. Incrémente le numéro du tour.
3. Initialise le compte à rebours à 30 secondes.
4. Réinitialise les validations du tour précédent.
5. Informe les deux clients que le tour commence.

### 8.2 Sélection des actions

Chaque joueur sélectionne une action dans son interface.

Les actions possibles sont :

- MOVE.
- SWEEP.
- STRIKE.
- SNIPER.
- PASS.

Le client envoie l'action choisie au serveur lors de sa validation.

### 8.3 Validation serveur

À la réception d'une action, le serveur :

- Vérifie l'identité du joueur.
- Vérifie que le joueur appartient au salon.
- Vérifie que le salon est dans l'état SELECTING.
- Vérifie que le joueur n'a pas déjà validé une action pour ce tour.
- Vérifie que l'action est correctement structurée.
- Vérifie que les paramètres sont dans les limites autorisées.
- Enregistre l'action.
- Enregistre son ordre de validation côté serveur.

Si l'action est valide, le serveur confirme la réception au joueur concerné.

### 8.4 Confidentialité pendant la sélection

Le serveur ne transmet pas l'action validée à l'adversaire.

L'adversaire peut uniquement savoir si le joueur a terminé sa sélection, sans connaître le contenu de son action.

Cette information peut être affichée sous la forme d'un indicateur neutre : « Joueur prêt ».

### 8.5 Début de la résolution

La résolution commence lorsque :

- Les deux joueurs ont validé une action.
- Ou le compte à rebours atteint zéro.

Si un joueur n'a pas validé d'action au moment de l'expiration, son action devient automatiquement PASS.

### 8.6 Résolution

Le serveur effectue les opérations dans cet ordre :

1. Verrouillage des actions du tour.
2. Révélation des actions.
3. Calcul des déplacements.
4. Application des déplacements.
5. Calcul des attaques.
6. Résolution des attaques selon leur priorité.
7. Mise à jour des points de vie.
8. Vérification des conditions de victoire.
9. Transmission du résultat aux deux clients.

### 8.7 Synchronisation

Le serveur transmet le résultat final du tour aux deux joueurs.

Les clients utilisent ces données pour mettre à jour l'affichage et jouer les animations correspondantes.

Les animations sont purement visuelles : elles ne modifient jamais le résultat calculé par le serveur.

---

## 9. Format des actions

### 9.1 MOVE

Une action MOVE contient :

- Le type d'action.
- Une direction de déplacement.
- Une distance.

La direction et la distance doivent être validées par le serveur.

La distance maximale autorisée est de 3 unités.

La destination calculée doit rester dans l'arène.

### 9.2 Attaques

Une action d'attaque contient :

- Le type d'attaque.
- Une direction d'attaque.

Les paramètres de portée, d'angle et de dégâts sont définis par la configuration du serveur.

Le client ne doit jamais envoyer une valeur de dégâts ou une portée personnalisée.

### 9.3 PASS

PASS ne contient aucun paramètre de déplacement ou d'attaque.

Le serveur traite cette action comme une absence d'action pendant le tour.

### 9.4 Validation des données

Toutes les données reçues doivent être validées côté serveur.

Les valeurs non numériques, infinies, non finies ou hors limites doivent être rejetées.

Les actions malformées ne doivent jamais modifier l'état de la partie.

---

## 10. Gestion de la priorité des actions

### 10.1 Ordre de validation

Le serveur enregistre un ordre de validation pour chaque action acceptée.

Cet ordre est attribué côté serveur et ne dépend pas de l'heure indiquée par le client.

### 10.2 Résolution des attaques

Si les deux joueurs ont choisi une attaque :

- Le serveur compare les ordres de validation.
- L'attaque validée en premier est résolue en premier.
- L'attaque du deuxième joueur est résolue ensuite si celui-ci est toujours en vie.

### 10.3 Égalité

En cas d'égalité exacte, le serveur utilise l'identifiant de siège attribué au début de la partie.

Cette règle doit être stable et déterministe.

### 10.4 Protection

Le client ne peut pas :

- Modifier son ordre de validation.
- Fournir un timestamp faisant autorité.
- Demander une priorité particulière.
- Modifier le résultat d'une attaque.

---

## 11. Déconnexion et reconnexion

### 11.1 Détection

Le serveur doit détecter les déconnexions WebSocket.

Une interruption réseau ne doit pas immédiatement entraîner la fin de la partie.

### 11.2 Déconnexion pendant la sélection

Si un joueur se déconnecte pendant la sélection :

- Son action déjà validée reste enregistrée.
- Si aucune action n'a été validée, le serveur attend la fin du timer.
- À l'expiration, son action devient PASS conformément aux règles du jeu.
- Le serveur conserve l'état de la partie pendant la période de reconnexion.

### 11.3 Délai de reconnexion

**Valeur proposée : 30 secondes.**

Le joueur peut rejoindre son salon et reprendre sa place pendant cette période.

La reconnexion doit être associée à son identité et à son jeton de session.

### 11.4 Reconnexion réussie

Lorsque le joueur se reconnecte :

- Le serveur vérifie son identité.
- Le serveur vérifie qu'il appartient toujours au salon.
- Le serveur lui transmet l'état actuel de la partie.
- Le joueur retrouve les informations publiques nécessaires.
- Le joueur peut reprendre la sélection si le tour est encore ouvert et qu'il n'a pas déjà validé son action.

Une action déjà validée ne peut pas être remplacée après reconnexion.

### 11.5 Expiration du délai

Si le joueur ne se reconnecte pas dans le délai autorisé :

- Il est considéré comme ayant abandonné la partie.
- Il perd la partie.
- Son adversaire est déclaré vainqueur.
- Le résultat est enregistré.

### 11.6 Déconnexion après la fin

Une déconnexion après la fin d'une partie n'affecte pas le résultat.

---

## 12. Gestion des erreurs

Le serveur doit gérer explicitement les situations suivantes :

| Situation                            | Comportement                        |
| ------------------------------------ | ----------------------------------- |
| Salon inexistant                     | Retourner une erreur                |
| Salon complet                        | Refuser la connexion                |
| Code privé invalide                  | Refuser la connexion                |
| Joueur non autorisé                  | Refuser la connexion                |
| Action malformée                     | Rejeter l'action                    |
| Action déjà validée                  | Refuser la nouvelle validation      |
| Action reçue après expiration        | Rejeter l'action                    |
| Message reçu hors phase de sélection | Rejeter le message                  |
| Connexion interrompue                | Activer la procédure de reconnexion |
| Serveur indisponible                 | Afficher une erreur de connexion    |

Les erreurs doivent être identifiables par des codes stables afin de faciliter leur traitement côté client.

Les messages d'erreur destinés à l'utilisateur doivent être compréhensibles.

---

## 13. Sécurité et prévention de la triche

### 13.1 Autorité serveur

Le serveur est l'unique autorité sur les résultats du jeu.

Toute action doit être vérifiée avant son exécution.

### 13.2 Validation des actions

Le serveur vérifie systématiquement :

- L'identité du joueur.
- Son appartenance au salon.
- La phase actuelle de la partie.
- Le numéro du tour.
- Le type d'action.
- Les paramètres de l'action.
- Les limites de déplacement.
- Les limites de l'arène.

### 13.3 Protection des actions secrètes

Les actions en attente doivent rester privées.

Aucune donnée transmise à un joueur ne doit lui permettre de reconstituer l'action non révélée de son adversaire.

### 13.4 Protection contre les messages abusifs

Le serveur doit prévoir :

- Une limitation de fréquence des messages.
- Un rejet des messages inattendus.
- Un contrôle des tailles de messages.
- Une validation stricte des données.
- Une protection contre les validations répétées.

### 13.5 Transport sécurisé

En production, les connexions doivent utiliser WebSocket sécurisé (WSS) via HTTPS.

Les jetons d'authentification doivent être protégés et ne jamais être affichés dans les journaux.

---

## 14. Persistance et résultats des parties

### 14.1 Données à conserver

Les données suivantes doivent pouvoir être enregistrées :

- Identifiant de la partie.
- Identifiants des deux joueurs.
- Date de début.
- Date de fin.
- Résultat.
- Nombre de tours.
- Points de vie finaux.
- Motif de fin de partie.

### 14.2 Enregistrement

Le serveur enregistre le résultat final après la fin de la partie.

L'enregistrement doit être réalisé de manière à éviter les doublons en cas de reconnexion ou de traitement répété d'un événement de fin.

### 14.3 Historique détaillé

La conservation de toutes les actions et de tous les événements de chaque tour n'est pas obligatoire pour le MVP.

Une journalisation technique limitée peut néanmoins être prévue pour faciliter le débogage.

---

## 15. Gestion de la charge et évolutivité

### 15.1 Objectif MVP

L'architecture initiale doit privilégier la simplicité et la fiabilité.

Un seul serveur de jeu peut gérer plusieurs salons indépendants.

Chaque salon doit isoler correctement ses joueurs et son état.

### 15.2 Isolation

Les données d'un salon ne doivent jamais être accessibles depuis un autre salon.

Les événements d'un salon ne doivent être transmis qu'aux joueurs autorisés.

### 15.3 Évolutions futures

L'architecture pourra évoluer vers :

- Plusieurs instances de serveurs.
- Un système de répartition de charge.
- Une gestion distribuée des salons.
- Un système de matchmaking avancé.
- Des statistiques et classements.
- Des mécanismes de supervision et de métriques.

Ces optimisations ne sont pas nécessaires pour le premier MVP.

---

## 16. Tests multijoueurs obligatoires

Les tests doivent couvrir les scénarios suivants.

### 16.1 Matchmaking

- Deux joueurs rejoignent un Quick Match et se retrouvent dans le même salon.
- Un troisième joueur ne peut pas rejoindre une partie complète.
- Un joueur peut annuler une recherche.
- Deux salons distincts restent isolés.

### 16.2 Salons privés

- Un joueur peut créer un salon privé.
- Le serveur génère un code valide.
- Un deuxième joueur peut rejoindre avec le code.
- Un code incorrect est refusé.
- Un troisième joueur ne peut pas rejoindre.
- Un salon expiré ne peut plus être rejoint.

### 16.3 Tours et actions

- Les deux joueurs peuvent valider une action.
- Une action validée reste secrète.
- Le serveur ne révèle pas l'action adverse prématurément.
- Les déplacements sont résolus avant les attaques.
- Une action non validée devient PASS à la fin du timer.
- Une action reçue après expiration est rejetée.
- Une deuxième validation pour le même tour est rejetée.

### 16.4 Priorité

- Le premier joueur à valider bénéficie de la priorité.
- Le serveur utilise son propre ordre de validation.
- Une égalité exacte est départagée de manière déterministe.
- Une attaque ne peut pas être exécutée par un joueur éliminé.

### 16.5 Déconnexion

- Un joueur peut se reconnecter à son salon.
- Son état est correctement restauré.
- Une action déjà validée n'est pas remplacée.
- Une déconnexion prolongée entraîne le résultat prévu.
- Une déconnexion après la fin ne modifie pas le résultat.

### 16.6 Sécurité

- Un joueur ne peut pas rejoindre un salon sans autorisation.
- Un joueur ne peut pas modifier les données de son adversaire.
- Un joueur ne peut pas envoyer une action pour un autre joueur.
- Un joueur ne peut pas imposer des dégâts ou une portée.
- Un joueur ne peut pas modifier le résultat d'une partie.

---

## 17. Critères de validation

Le système multijoueur du MVP est considéré comme fonctionnel lorsque :

1. Deux joueurs peuvent se connecter et jouer ensemble.
2. Le Quick Match permet de réunir deux joueurs.
3. Les salons privés fonctionnent avec un code d'invitation.
4. Un salon ne peut jamais accueillir plus de deux joueurs.
5. Les actions restent secrètes jusqu'à leur révélation.
6. Le serveur contrôle le timer et la résolution des tours.
7. Les déplacements et les attaques sont résolus dans le bon ordre.
8. La priorité des attaques est déterminée côté serveur.
9. Les déconnexions et reconnexions sont correctement gérées.
10. Les résultats sont enregistrés sans doublon.
11. Les joueurs ne peuvent pas accéder aux données privées de leur adversaire.
12. Les tests multijoueurs essentiels passent avec deux clients indépendants.

---

## 18. Décisions techniques à reporter dans TECHNICAL_SPEC.md

Les éléments suivants devront être précisés dans le document technique :

- Organisation exacte des rooms Colyseus.
- Structure TypeScript des messages réseau.
- Schémas de validation des messages.
- Modèle d'état synchronisé.
- Gestion des données privées par joueur.
- Format et stockage des jetons de session.
- Gestion du cycle de vie des salons.
- Configuration des timers serveur.
- Mécanisme de reconnexion Colyseus.
- Schéma PostgreSQL des joueurs et des parties.
- Gestion des erreurs et des logs.
- Configuration WSS en production.
- Stratégie de déploiement du serveur.

**Fin du document — HEX DUEL MULTIPLAYER SPECIFICATION v0.1**
