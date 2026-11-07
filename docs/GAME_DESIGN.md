# HEX DUEL — GAME DESIGN DOCUMENT

**Version :** 1.1  
**Statut :** Draft consolidé — décisions de gameplay validées  
**Projet :** HEX DUEL  
**Type :** Jeu multijoueur tactique en ligne — 1 contre 1

---

## 1. Vision du jeu

### 1.1 Concept

HEX DUEL est un jeu tactique multijoueur en ligne opposant deux joueurs dans une arène hexagonale.

À chaque tour, les deux joueurs choisissent secrètement une action parmi plusieurs possibilités. Ils disposent de 30 secondes pour valider leur choix.

Une fois les deux actions enregistrées, le serveur les révèle et les résout selon des règles précises.

Le gameplay repose sur trois éléments :

- Anticiper les intentions de l'adversaire.
- Choisir entre se déplacer et attaquer.
- Exploiter intelligemment la portée et l'orientation des attaques.

### 1.2 Objectifs

Le jeu doit être :

- Facile à comprendre.
- Rapide à jouer.
- Tactique, avec une véritable dimension d'anticipation.
- Compétitif, grâce à des règles cohérentes et déterministes.
- Accessible directement depuis un navigateur web.

### 1.3 Format

- Deux joueurs exactement par partie.
- Parties en ligne.
- Matchmaking aléatoire.
- Création de salons privés avec code d'invitation.
- Une seule arène pour le MVP.

---

## 2. Univers et direction artistique

### 2.1 Style visuel

Le jeu adopte une direction artistique minimaliste et lisible.

L'environnement est constitué d'une plateforme hexagonale flottante ou isolée, représentée en véritable 3D.

La caméra utilise une perspective isométrique ou quasi isométrique.

### 2.2 Arène

- Forme : hexagone régulier.
- Surface : plane.
- Aucun obstacle dans le MVP.
- Aucun élément de décor ne doit gêner la lecture du gameplay.
- Les limites de l'arène doivent être clairement visibles.

### 2.3 Personnages

Les personnages sont représentés par des capsules simples, de type pilule.

- Joueur 1 : rouge.
- Joueur 2 : bleu.
- Forme géométrique simple.
- Animation légère lors des déplacements et des attaques.
- Orientation visuelle clairement identifiable.

Les personnages ne disposent pas de caractéristiques différentes dans le MVP.

---

## 3. Structure d'une partie

### 3.1 Paramètres généraux

Les paramètres initiaux du gameplay sont les suivants :

| Paramètre                        |      Valeur |
| -------------------------------- | ----------: |
| Nombre de joueurs                |           2 |
| Points de vie initiaux           |         100 |
| Durée de sélection par tour      | 30 secondes |
| Nombre maximal de tours          |          30 |
| Rayon de l'arène                 |   12 unités |
| Distance maximale de déplacement |    3 unités |

Ces paramètres doivent être centralisés dans la configuration du jeu afin de pouvoir être modifiés facilement.

### 3.2 Déroulement général

Une partie suit le cycle suivant :

1. Les deux joueurs rejoignent la partie.
2. Le serveur initialise l'arène et les positions de départ.
3. Le tour commence.
4. Les deux joueurs choisissent secrètement leur action.
5. Chaque joueur valide son action.
6. Le serveur attend les deux validations ou la fin du timer.
7. Les actions sont révélées.
8. Les déplacements sont résolus.
9. Les attaques sont résolues.
10. Les points de vie et les conditions de victoire sont vérifiés.
11. Le tour suivant commence si la partie continue.

### 3.3 Conditions de départ

Les deux personnages commencent avec 100 points de vie.

Leurs positions initiales doivent être symétriques ou suffisamment éloignées pour éviter une situation avantageant directement l'un des joueurs.

---

## 4. Système de tours et de sélection des actions

### 4.1 Sélection secrète

Chaque joueur choisit son action sans connaître celle de son adversaire.

Les actions sélectionnées ne sont pas visibles par l'autre joueur avant la résolution du tour.

Le serveur conserve les actions de manière privée jusqu'au moment de leur révélation.

### 4.2 Durée du tour

Chaque joueur dispose de 30 secondes pour sélectionner et valider son action.

Le compte à rebours est synchronisé par le serveur.

### 4.3 Validation

Une action est considérée comme validée uniquement lorsque le serveur a reçu et accepté la confirmation du joueur.

Un joueur ayant validé son action peut attendre la validation de son adversaire.

### 4.4 Expiration du timer

**Décision validée : PASS automatique.**

Si un joueur n'a pas validé d'action à la fin des 30 secondes, son action est automatiquement considérée comme PASS.

La dernière action simplement sélectionnée dans l'interface, mais non validée, n'est pas prise en compte.

PASS signifie que le joueur ne réalise ni déplacement ni attaque pendant ce tour.

### 4.5 Ordre de résolution

Les actions sont toujours résolues dans cet ordre :

1. Révélation des deux actions.
2. Calcul et application des déplacements.
3. Calcul et application des attaques.
4. Mise à jour des points de vie.
5. Vérification des conditions de fin de partie.

Cet ordre est obligatoire et ne dépend pas du type d'action choisi par les joueurs.

---

## 5. Déplacements

### 5.1 Principe

Un joueur peut choisir de déplacer son personnage dans n'importe quelle direction.

Le déplacement est libre sur 360 degrés, dans la limite de la distance maximale autorisée.

### 5.2 Paramètres

- Distance maximale par tour : 3 unités.
- Déplacement dans le plan horizontal de l'arène.
- Aucun déplacement vertical.
- Le personnage doit rester dans les limites de l'arène.

### 5.3 Orientation du personnage

**Décision validée : orientation indépendante.**

L'orientation du personnage est indépendante de son déplacement.

Cela signifie que :

- Le personnage peut se déplacer dans une direction sans nécessairement regarder dans cette direction.
- Le joueur peut choisir une orientation d'attaque indépendamment de sa position et de son déplacement.
- L'orientation visuelle ne doit pas être automatiquement modifiée par un déplacement.
- Lorsqu'une attaque est sélectionnée, l'orientation du personnage peut être mise à jour pour représenter la direction de l'attaque.

La direction d'attaque est donc une donnée distincte de la direction de déplacement.

### 5.4 Résolution des déplacements

Les déplacements des deux joueurs sont calculés à partir des positions initiales du tour.

Ils sont ensuite appliqués simultanément.

Le serveur vérifie que les positions finales sont valides et respectent les limites de l'arène.

### 5.5 Collision entre personnages

Deux personnages ne peuvent pas occuper une position finale qui provoque un chevauchement de leurs volumes de collision.

Si les deux destinations finales provoquent un chevauchement, les deux déplacements sont annulés.

Les deux personnages conservent alors leurs positions initiales.

### 5.6 Croisement des trajectoires

**Décision validée : croisement autorisé.**

Les trajectoires des deux personnages peuvent se croiser pendant un tour.

Le croisement des trajectoires n'entraîne pas automatiquement l'annulation des déplacements.

Seule la vérification des positions finales et de leur éventuel chevauchement détermine si les déplacements peuvent être appliqués.

---

## 6. Système d'attaque

### 6.1 Principes généraux

Le joueur dispose de trois attaques différentes.

Chaque attaque possède :

- Une portée maximale.
- Un angle d'ouverture.
- Une valeur de dégâts.

Les attaques sont directionnelles.

Le joueur doit choisir une direction d'attaque indépendamment de son déplacement.

### 6.2 Attaque courte portée — SWEEP

| Paramètre         |   Valeur |
| ----------------- | -------: |
| Nom               |    SWEEP |
| Portée maximale   | 2 unités |
| Angle d'ouverture |     180° |
| Dégâts            |    25 HP |

Attaque de courte portée avec un angle très large.

Elle est adaptée aux situations dans lesquelles les personnages sont proches.

### 6.3 Attaque moyenne portée — STRIKE

| Paramètre         |   Valeur |
| ----------------- | -------: |
| Nom               |   STRIKE |
| Portée maximale   | 5 unités |
| Angle d'ouverture |      90° |
| Dégâts            |    30 HP |

Attaque de portée intermédiaire avec un angle plus réduit.

Elle demande un meilleur positionnement et une orientation plus précise.

### 6.4 Attaque longue portée — SNIPER

| Paramètre         |    Valeur |
| ----------------- | --------: |
| Nom               |    SNIPER |
| Portée maximale   | 12 unités |
| Angle d'ouverture |       10° |
| Dégâts            |     40 HP |

Attaque longue portée avec un angle très étroit.

Elle nécessite une visée particulièrement précise.

### 6.5 Calcul de la portée

**Décision validée : distance entre les centres.**

La portée d'une attaque est calculée entre le centre du personnage attaquant et le centre du personnage ciblé.

Les dimensions physiques des capsules ne sont pas soustraites à cette distance.

Une attaque est valide uniquement si la distance entre les deux centres est inférieure ou égale à la portée maximale de l'attaque.

### 6.6 Calcul de l'angle

Le serveur compare :

- La direction d'attaque choisie par le joueur.
- Le vecteur reliant le centre de l'attaquant au centre de la cible.

L'angle entre ces deux directions détermine si la cible se trouve dans le cône d'attaque.

L'angle indiqué pour chaque attaque correspond à l'ouverture totale du cône.

Par conséquent :

- SWEEP : ±90° autour de la direction d'attaque.
- STRIKE : ±45° autour de la direction d'attaque.
- SNIPER : ±5° autour de la direction d'attaque.

### 6.7 Conditions de réussite

Une attaque touche uniquement si les deux conditions suivantes sont réunies :

1. La cible se trouve dans la portée maximale de l'attaque.
2. La cible se trouve dans l'angle d'ouverture de l'attaque.

Si l'une des deux conditions n'est pas respectée, l'attaque échoue et inflige zéro dégât.

### 6.8 Moment du calcul

Les attaques sont calculées après la résolution des déplacements.

Le serveur utilise donc les positions finales des personnages pour déterminer si une attaque touche.

Cela signifie qu'un déplacement peut permettre d'éviter une attaque ou, au contraire, de se retrouver dans sa zone d'effet.

---

## 7. Priorité des attaques

### 7.1 Principe

**Décision validée : priorité selon l'ordre de validation.**

Lorsque les deux joueurs choisissent une attaque, le serveur utilise l'ordre de validation pour déterminer laquelle est résolue en premier.

Le premier joueur ayant validé son action bénéficie de la priorité.

### 7.2 Résolution séquentielle

Les attaques sont résolues l'une après l'autre.

Pour chaque attaque :

1. Le serveur vérifie que l'attaquant est encore en vie.
2. Il vérifie les conditions de portée et d'angle.
3. Il applique les dégâts si l'attaque touche.
4. Il vérifie si le joueur ciblé est encore en vie.

Si la première attaque élimine son adversaire, la seconde attaque n'est pas exécutée.

### 7.3 Égalité exacte des validations

Si le serveur reçoit les deux validations avec un ordre temporel strictement identique, il applique une règle de départage déterministe basée sur l'identifiant de siège attribué au début de la partie.

Cette règle doit toujours produire le même résultat pour un même état de partie.

### 7.4 Conséquence stratégique

La priorité récompense le joueur qui valide son action en premier.

Elle introduit un élément supplémentaire de décision, sans révéler les choix de l'adversaire avant la résolution.

---

## 8. Points de vie et victoire

### 8.1 Points de vie

Chaque joueur commence avec 100 HP.

Les dégâts réduisent directement les points de vie.

Les points de vie ne peuvent pas être inférieurs à zéro.

### 8.2 Élimination

Un joueur est éliminé lorsque ses points de vie atteignent zéro.

Un joueur éliminé ne peut plus effectuer d'action.

### 8.3 Conditions de victoire

Une partie se termine dans les cas suivants :

- Un joueur est éliminé : son adversaire gagne.
- Les deux joueurs sont éliminés au cours du même tour : match nul.
- Le nombre maximal de 30 tours est atteint : le joueur ayant le plus de HP gagne.
- Les deux joueurs ont le même nombre de HP à la fin du 30e tour : match nul.

### 8.4 Vérification de fin de partie

La vérification des conditions de victoire intervient après la résolution complète des actions du tour, en tenant compte des règles de priorité des attaques.

---

## 9. États d'une partie

Une partie peut se trouver dans les états suivants :

| État      | Description                           |
| --------- | ------------------------------------- |
| WAITING   | En attente du deuxième joueur         |
| READY     | Les deux joueurs sont présents        |
| SELECTING | Les joueurs sélectionnent leur action |
| RESOLVING | Le serveur résout les actions du tour |
| FINISHED  | La partie est terminée                |
| CANCELLED | La partie a été annulée               |

Le serveur est l'autorité de référence pour les transitions entre ces états.

---

## 10. Interface de gameplay

### 10.1 Écran principal de jeu

L'écran de jeu doit afficher :

- L'arène 3D.
- Les deux personnages.
- Les points de vie des deux joueurs.
- Le numéro du tour.
- Le compte à rebours.
- Les actions disponibles.
- Les contrôles de déplacement et d'orientation d'attaque.

### 10.2 Sélection d'une action

Le joueur doit pouvoir choisir :

- Un déplacement.
- SWEEP.
- STRIKE.
- SNIPER.
- PASS, si cette action est proposée explicitement dans l'interface.

### 10.3 Contrôle du déplacement

Le joueur doit pouvoir définir une direction et une distance de déplacement.

La distance ne doit jamais dépasser 3 unités.

### 10.4 Contrôle de l'attaque

Lorsqu'une attaque est sélectionnée, le joueur doit pouvoir orienter sa direction de tir.

Une indication visuelle du cône d'attaque peut être affichée au joueur pendant sa sélection.

Cette indication ne doit jamais révéler la position ou l'action secrète choisie par l'adversaire.

### 10.5 Confidentialité des actions

Avant la résolution :

- Le joueur voit sa propre action.
- Le joueur ne voit pas l'action de l'adversaire.
- Le joueur ne voit pas la direction choisie par l'adversaire.
- Le joueur ne voit pas la destination de déplacement adverse.

Après la validation des deux actions ou l'expiration du timer, les actions sont révélées et résolues.

---

## 11. Progression et statistiques

Le MVP doit permettre de conserver des statistiques de base.

Données envisagées :

- Nombre de parties jouées.
- Nombre de victoires.
- Nombre de défaites.
- Nombre de matchs nuls.
- Pseudonyme du joueur.

Les comptes utilisateurs complets ne sont pas obligatoires pour le MVP.

Un système d'identification invité peut être utilisé.

---

## 12. Paramètres centralisés du gameplay

Les valeurs de gameplay doivent être regroupées dans une configuration centralisée.

Valeurs initiales :

| Paramètre         |      Valeur |
| ----------------- | ----------: |
| MAX_HP            |         100 |
| TURN_DURATION     | 30 secondes |
| MAX_TURNS         |          30 |
| ARENA_RADIUS      |          12 |
| MAX_MOVE_DISTANCE |           3 |
| SWEEP_RANGE       |           2 |
| SWEEP_ANGLE       |        180° |
| SWEEP_DAMAGE      |          25 |
| STRIKE_RANGE      |           5 |
| STRIKE_ANGLE      |         90° |
| STRIKE_DAMAGE     |          30 |
| SNIPER_RANGE      |          12 |
| SNIPER_ANGLE      |         10° |
| SNIPER_DAMAGE     |          40 |

Les règles de priorité, de collision, d'orientation et de résolution doivent également être centralisées ou clairement documentées dans la logique de jeu.

---

## 13. Fonctionnalités hors périmètre du MVP

Les fonctionnalités suivantes ne sont pas prévues dans la première version :

- Plusieurs arènes.
- Obstacles et éléments destructibles.
- Personnages avec statistiques différentes.
- Compétences spéciales.
- Boutique.
- Cosmétiques.
- Système de classement avancé.
- Tournois.
- Chat intégré.
- Système d'amis.
- Replays.
- Mode solo contre une intelligence artificielle.

Ces fonctionnalités pourront être étudiées après validation du MVP.

---

## 14. Principes fondamentaux du jeu

Les principes suivants doivent être respectés dans toutes les implémentations :

1. Le serveur est l'autorité de référence pour les règles et le résultat d'une partie.
2. Les actions des joueurs restent secrètes jusqu'à leur résolution.
3. Les déplacements sont toujours résolus avant les attaques.
4. Les déplacements sont calculés simultanément.
5. Les trajectoires peuvent se croiser si les positions finales ne se chevauchent pas.
6. L'orientation du personnage est indépendante du déplacement.
7. Les portées d'attaque sont calculées entre les centres des personnages.
8. Les angles d'attaque sont calculés dans le plan horizontal de l'arène.
9. Les attaques sont résolues séquentiellement selon la priorité de validation.
10. Une action non validée à l'expiration du timer devient PASS.
11. Les règles de jeu doivent être déterministes et identiques pour les deux joueurs.
12. L'interface ne doit jamais révéler prématurément les actions adverses.

---

## 15. Critères de validation du GDD

Le GAME DESIGN DOCUMENT est considéré comme suffisamment défini pour passer aux spécifications techniques lorsque :

- Le concept du jeu est clairement défini.
- Les paramètres fondamentaux du gameplay sont identifiés.
- Les actions disponibles sont définies.
- Les déplacements et les collisions sont spécifiés.
- Les attaques et leurs calculs sont spécifiés.
- L'ordre de résolution des actions est défini.
- Les conditions de victoire sont définies.
- Les décisions de gameplay structurantes sont validées.

**Fin du document — HEX DUEL GAME DESIGN DOCUMENT v1.1**

---

## 16. Système de bonus sur l'arène

### 16.1 Principe

Des bonus apparaissent sur l'arène pendant la partie. Le ramassage est automatique : aucune action dédiée n'est nécessaire. Un bonus ramassé est dit « armé » et persiste jusqu'à son utilisation — aucune expiration.

### 16.2 Les quatre bonus

| Bonus | Effet | Consommation |
| ----- | ----- | ------------ |
| Régénération | +1 cristal (maximum 3), effet IMMÉDIAT | Immédiate, n'occupe pas d'emplacement |
| Boost de déplacement | Portée de déplacement 5 → 7 | Prochain déplacement |
| Boost d'attaque | STRIKE 6/90° → 8/180°, SNIPER 10/10° → 12/25° | Prochaine attaque (une seule) |
| Bouclier | Absorbe le prochain coup reçu | Prochain coup reçu |

### 16.3 Emplacement unique

Un seul bonus armé à la fois par joueur (régénération exceptée). Ramasser un nouveau bonus remplace immédiatement l'ancien.

### 16.4 Ramassage

Trois façons de ramasser un bonus :

1. La position finale du déplacement se trouve sur le bonus.
2. La trajectoire du déplacement passe au travers du bonus.
3. La zone d'une attaque couvre le bonus. Une attaque qui ramasse un bonus se résout normalement.

Si les deux joueurs ramassent le même bonus au cours du même tour, personne ne l'obtient : le bonus reste au sol.

### 16.5 Apparition des bonus

- Le serveur tire au sort un seed en début de partie ; le planning des apparitions est déterministe (même seed → même planning).
- Quantités tirées au sort : régénération 1-2, boost d'attaque 3-4, boost de déplacement 3-5, bouclier 2 (total 9 à 13 par partie).
- Un seul bonus apparaît par tour maximum.
- Premier bonus au tour 2 ou 3 ; dernière apparition possible au tour 22.
- Répartition aléatoire des tours dans cette fenêtre, sans deux apparitions le même tour.
- La position est calculée au tour de l'apparition (même seed), avec équité spatiale vis-à-vis des positions des deux joueurs.

### 16.6 Durée de vie au sol et limite

Un bonus au sol vit le tour de son apparition plus le tour suivant, puis disparaît s'il n'a pas été ramassé. Deux bonus simultanés au sol maximum.
