# HEX DUEL — UI / UX SPECIFICATION

**Version :** 1.1  
**Statut :** Draft consolidé — direction artistique et interactions validées  
**Projet :** HEX DUEL  
**Application :** Web desktop et mobile  
**Technologies :** Nuxt 4, Vue 3, Three.js

---

# 1. Objectif du document

Ce document définit l'interface utilisateur et l'expérience utilisateur de HEX DUEL.

Il décrit :

- La direction artistique.
- L'organisation des écrans.
- La navigation.
- Les menus.
- Le lobby.
- L'interface de jeu.
- Les contrôles de déplacement et d'attaque.
- Les animations.
- Les retours visuels et sonores.
- Les états de chargement et les erreurs.
- L'adaptation aux différentes tailles d'écran.
- Le système multilingue.
- L'accessibilité et la lisibilité.

L'objectif est de fournir une référence suffisamment précise pour permettre à l'agent IA de développer une interface cohérente.

Les règles de gameplay sont définies dans `GAME_DESIGN.md`.

Les règles réseau sont définies dans `MULTIPLAYER_SPEC.md`.

Les contraintes techniques sont définies dans `TECHNICAL_SPEC.md`.

---

# 2. Direction artistique

## 2.1 Identité visuelle

**Décision validée : style minimaliste.**

HEX DUEL adopte une direction artistique minimaliste, moderne et compétitive.

Caractéristiques :

- Interface épurée.
- Formes géométriques simples.
- Surfaces sobres.
- Peu d'effets décoratifs.
- Contrastes nets.
- Animations discrètes.
- Informations faciles à identifier.

Le jeu doit privilégier la lisibilité et la compréhension tactique plutôt que les effets visuels spectaculaires.

## 2.2 Thème général

Le thème visuel repose sur une interface sombre et minimaliste.

L'environnement doit rester sobre afin de mettre en valeur :

- L'arène hexagonale.
- Les deux personnages.
- Les zones d'attaque.
- Les déplacements.
- Les informations de combat.

Les panneaux doivent être simples, sans surcharge de bordures, d'ombres ou de dégradés.

## 2.3 Palette de couleurs

Palette indicative :

| Élément              | Couleur |
| -------------------- | ------- |
| Fond principal       | #101218 |
| Fond secondaire      | #191D26 |
| Surface des panneaux | #222735 |
| Bordures             | #343B4B |
| Texte principal      | #F5F7FA |
| Texte secondaire     | #9BA4B5 |
| Joueur rouge         | #FF4D5A |
| Joueur bleu          | #4D91FF |
| Accent neutre        | #8D7CFF |
| Succès               | #42C98A |
| Avertissement        | #F5B942 |
| Erreur               | #F05A62 |

Les couleurs rouge et bleu sont principalement réservées à l'identification des joueurs.

Les autres couleurs sont utilisées avec modération.

## 2.4 Typographie

Utiliser une typographie sans-serif moderne.

Caractéristiques :

- Titres nets.
- Texte courant lisible.
- Chiffres facilement identifiables.
- Bonne lisibilité des compteurs et des points de vie.

Les polices doivent être intégrées ou chargées de manière fiable.

## 2.5 Iconographie

Les icônes doivent être simples, géométriques et cohérentes.

Éviter les illustrations décoratives sans fonction.

Les icônes des actions doivent être facilement distinguables :

- Déplacement.
- Attaque courte portée.
- Attaque moyenne portée.
- Attaque longue portée.
- PASS.

---

# 3. Principes UX fondamentaux

## 3.1 Simplicité

Le joueur doit comprendre immédiatement :

- Comment commencer une partie.
- Comment rejoindre un adversaire.
- Comment choisir une action.
- Comment valider son action.
- Comment lire le résultat d'un tour.

## 3.2 Lisibilité

Les informations importantes doivent être visibles sans effort :

- Points de vie.
- Timer.
- Numéro du tour.
- Action sélectionnée.
- État de validation.

## 3.3 Confidentialité

Le joueur ne doit jamais voir l'action adverse avant la résolution du tour.

L'interface indique uniquement si l'adversaire a validé son action.

## 3.4 Réactivité

Chaque interaction doit produire un retour visuel immédiat.

Exemples :

- Bouton sélectionné.
- Action validée.
- Compte à rebours actif.
- Connexion en cours.
- Attaque réussie.
- Dégâts reçus.

## 3.5 Cohérence

Les mêmes conventions visuelles doivent être utilisées dans tous les écrans.

Les boutons, panneaux, icônes et états doivent conserver une apparence cohérente.

---

# 4. Navigation générale

## 4.1 Structure

L'application comporte les écrans suivants :

| Écran        | Fonction                           |
| ------------ | ---------------------------------- |
| Accueil      | Présentation et accès au jeu       |
| Play         | Choix du mode de jeu               |
| Quick Match  | Recherche d'un adversaire          |
| Private Room | Création ou accès à un salon privé |
| Game         | Interface de combat                |
| Profile      | Statistiques du joueur             |
| Settings     | Paramètres                         |
| Match Result | Résultat d'une partie              |

## 4.2 Navigation principale

Le menu principal doit permettre d'accéder aux fonctionnalités essentielles.

Éléments :

- Logo HEX DUEL.
- Bouton Play.
- Bouton Profile.
- Bouton Settings.
- Sélecteur de langue.

Le menu doit rester minimaliste.

Les fonctionnalités sociales non prévues dans le MVP ne doivent pas apparaître.

---

# 5. Écran d'accueil

## 5.1 Objectif

Présenter immédiatement HEX DUEL et permettre au joueur de commencer rapidement.

## 5.2 Composition

L'écran comprend :

- Logo HEX DUEL.
- Nom du jeu.
- Courte phrase de présentation.
- Bouton principal PLAY.
- Accès au profil.
- Accès aux paramètres.
- Sélecteur de langue.

## 5.3 Direction visuelle

Le fond est sobre et sombre.

Une représentation 3D minimaliste de l'arène hexagonale peut être utilisée en arrière-plan.

Les personnages rouge et bleu peuvent apparaître sur l'arène.

L'illustration doit rester discrète afin de ne pas nuire à la lisibilité des boutons.

## 5.4 Interaction

Le bouton PLAY ouvre l'écran de sélection du mode de jeu.

---

# 6. Écran Play

## 6.1 Objectif

Permettre au joueur de choisir comment lancer une partie.

## 6.2 Composition

Deux options principales sont affichées :

**QUICK MATCH**

Permet de rechercher automatiquement un adversaire.

**PRIVATE ROOM**

Permet de créer un salon privé ou de rejoindre un salon existant.

## 6.3 Interaction

Les deux options doivent être facilement identifiables.

Le choix Quick Match ouvre l'écran de matchmaking.

Le choix Private Room ouvre l'interface des salons privés.

---

# 7. Quick Match

## 7.1 Objectif

Permettre de trouver rapidement un adversaire.

## 7.2 État de recherche

L'écran affiche :

- Texte de recherche d'adversaire.
- Animation de recherche minimaliste.
- Bouton Cancel.

## 7.3 Recherche réussie

Lorsque le serveur trouve un adversaire :

- Afficher une confirmation.
- Afficher les pseudonymes des deux joueurs.
- Afficher une transition courte.
- Préparer l'ouverture de l'écran de jeu.

## 7.4 Annulation

Le bouton Cancel permet d'annuler la recherche.

L'interface revient à l'écran Play lorsque le serveur confirme l'annulation.

---

# 8. Private Room

## 8.1 Objectif

Permettre à deux joueurs de se retrouver dans une partie privée.

## 8.2 Création

L'interface affiche un bouton CREATE ROOM.

Après création :

- Afficher le code d'invitation.
- Ajouter un bouton COPY.
- Afficher l'état WAITING FOR OPPONENT.
- Afficher un bouton CANCEL.

Le code doit être suffisamment visible pour être partagé facilement.

## 8.3 Rejoindre

L'interface affiche :

- Un champ pour saisir le code.
- Un bouton JOIN.
- Un message d'erreur si le code est invalide.

Le code doit être nettoyé et validé avant son envoi au serveur.

## 8.4 Salon complet

Lorsque le deuxième joueur rejoint :

- Afficher les deux pseudonymes.
- Afficher une confirmation.
- Passer automatiquement à la préparation de la partie.

---

# 9. Préparation de la partie

## 9.1 Objectif

Présenter les deux joueurs avant le début du combat.

## 9.2 Composition

Afficher :

- Le nom du joueur rouge.
- Le nom du joueur bleu.
- Les deux personnages.
- Un aperçu de l'arène.
- Un compte à rebours de lancement.

## 9.3 Transition

Une animation courte prépare le joueur à entrer dans l'arène.

La transition ne doit pas retarder inutilement le démarrage.

---

# 10. Interface principale de jeu

## 10.1 Objectif

L'interface de jeu est l'écran central de HEX DUEL.

Elle doit afficher les informations essentielles sans masquer l'arène.

## 10.2 Organisation générale

**Zone centrale**

- Arène 3D.
- Personnage rouge.
- Personnage bleu.
- Indicateurs de déplacement et d'attaque.

**Zone supérieure**

- Points de vie des deux joueurs.
- Numéro du tour.
- Compte à rebours.

**Zone inférieure**

- Sélection des actions.
- Contrôles de direction.
- Bouton de validation.

**Zone secondaire**

- Messages d'état.
- Résultat du dernier tour.
- Indicateur de connexion.

## 10.3 HUD

Le HUD doit rester compact et lisible.

Les panneaux doivent utiliser des surfaces sobres et ne pas recouvrir inutilement l'arène.

---

# 11. Affichage des joueurs et des points de vie

## 11.1 Joueur rouge

Afficher :

- Pseudonyme.
- Couleur rouge.
- Barre de vie.
- Valeur numérique des HP.

## 11.2 Joueur bleu

Afficher :

- Pseudonyme.
- Couleur bleue.
- Barre de vie.
- Valeur numérique des HP.

## 11.3 Barres de vie

Les barres de vie doivent :

- Être faciles à comparer.
- Se mettre à jour après chaque résolution.
- Utiliser la couleur du joueur.
- Afficher les HP restants.

Les changements de vie peuvent être accompagnés d'une animation courte.

---

# 12. Compte à rebours et numéro du tour

## 12.1 Timer

Le timer est visible pendant toute la phase de sélection.

Il commence à 30 secondes.

Il doit être suffisamment visible pour rappeler au joueur le temps disponible.

## 12.2 États visuels

Le timer change progressivement d'apparence lorsque le temps devient faible.

- Plus de 10 secondes : affichage normal.
- 10 secondes ou moins : avertissement visuel.
- 5 secondes ou moins : affichage urgent.

Ces seuils sont des choix d'interface et ne modifient pas les règles serveur.

## 12.3 Numéro du tour

Afficher le numéro du tour sous une forme compacte :

`TURN 01 / 30`

---

# 13. Sélection des actions

## 13.1 Principe

Le joueur doit pouvoir sélectionner une action parmi :

- MOVE.
- SWEEP.
- STRIKE.
- SNIPER.
- PASS.

Les actions sont affichées sous forme de boutons distincts.

## 13.2 État sélectionné

Une action sélectionnée doit présenter un état visuel évident.

Les autres actions restent disponibles tant que le joueur n'a pas validé son choix.

## 13.3 Description

Chaque action doit afficher ses caractéristiques.

| Action | Portée | Angle | Dégâts |
| ------ | -----: | ----: | -----: |
| SWEEP  |      2 |  180° |     25 |
| STRIKE |      5 |   90° |     30 |
| SNIPER |     12 |   10° |     40 |
| MOVE   | 3 max. |  360° |      0 |
| PASS   |      — |     — |      0 |

## 13.4 Validation

Un bouton CONFIRM permet de valider l'action sélectionnée.

Après validation :

- L'action devient définitive pour ce tour.
- Les contrôles sont désactivés.
- L'interface affiche ACTION LOCKED.
- Le joueur attend la validation adverse ou la fin du timer.

Une action validée ne peut pas être modifiée.

---

# 14. Contrôle du déplacement

## 14.1 Décision validée

**Contrôle desktop : souris.**

Le joueur sélectionne directement une destination dans l'arène.

## 14.2 Interaction

Lorsque MOVE est sélectionné :

1. Le joueur clique ou maintient le bouton de la souris dans l'arène.
2. La position du pointeur détermine une destination sur le plan horizontal.
3. Le système calcule la distance entre la position actuelle et la destination.
4. La destination est limitée à 3 unités maximum.
5. Le joueur confirme son action.

Le contrôle doit être intuitif et précis.

## 14.3 Indications visuelles

Pendant la sélection :

- Afficher la position actuelle du personnage.
- Afficher la destination envisagée.
- Afficher une ligne de trajectoire.
- Afficher la distance calculée.
- Afficher la limite maximale de déplacement.

La destination envisagée doit être clairement identifiable.

## 14.4 Limites

La destination ne doit jamais dépasser 3 unités de déplacement.

Une destination hors de l'arène doit être corrigée ou refusée côté interface.

Le serveur reste responsable de la validation définitive.

---

# 15. Contrôle des attaques

## 15.1 Décision validée

La souris est utilisée pour orienter les attaques.

La direction d'attaque est indépendante du déplacement.

## 15.2 Interaction

Lorsque le joueur sélectionne une attaque :

1. Le personnage local devient la référence de visée.
2. Le pointeur de la souris détermine la direction d'attaque dans le plan X/Z.
3. Le système calcule l'angle correspondant.
4. L'indicateur visuel est mis à jour.
5. Le joueur confirme son action.

Le joueur doit pouvoir viser librement sur 360 degrés.

## 15.3 Visualisation

Pendant la sélection, afficher :

- Une ligne indiquant la direction d'attaque.
- Le cône correspondant à l'angle de l'attaque.
- La portée maximale.
- Une indication visuelle de la zone ciblée.

Les indications doivent respecter les paramètres exacts des attaques.

## 15.4 Confidentialité

Le joueur ne doit jamais voir :

- La direction d'attaque adverse.
- Le cône adverse.
- La destination de déplacement adverse.
- L'action sélectionnée par l'adversaire.

Les indications visuelles doivent utiliser uniquement les données locales.

---

# 16. Caméra et environnement 3D

## 16.1 Décision validée

**Caméra isométrique fixe.**

La caméra utilise une perspective isométrique ou quasi isométrique, avec une orientation stable pendant toute la partie.

## 16.2 Comportement

- La caméra conserve son angle.
- Elle ne tourne pas automatiquement autour de l'arène.
- Elle ne suit pas individuellement les personnages.
- Elle conserve l'arène entière dans le champ de vision.
- Elle ne doit pas modifier la perception des distances et des directions de manière trompeuse.

Un zoom limité peut être envisagé si nécessaire, sans modifier l'orientation de la caméra.

## 16.3 Arène

L'arène est une plateforme hexagonale plane.

Sa représentation doit être :

- Géométrique.
- Épurée.
- Sans obstacles dans le MVP.
- Facile à lire depuis la caméra fixe.

Les limites de l'arène doivent être visibles.

## 16.4 Personnages

Les personnages sont des capsules simples :

- Rouge pour le joueur 1.
- Bleu pour le joueur 2.

Leur orientation visuelle est indépendante du déplacement.

La direction de l'attaque peut être indiquée visuellement lorsque le joueur sélectionne une attaque.

---

# 17. État de validation

## 17.1 Joueur local

Après validation :

- Afficher ACTION LOCKED.
- Masquer les contrôles de sélection.
- Afficher un indicateur d'attente.

## 17.2 Adversaire

Afficher uniquement :

- OPPONENT CHOOSING.
- OPPONENT READY.

Ne jamais afficher le contenu de son action.

## 17.3 Deux joueurs prêts

Lorsque les deux actions sont validées :

- Afficher une transition courte.
- Révéler les actions.
- Lancer la résolution.

---

# 18. Animation de résolution

## 18.1 Principe

Les animations doivent représenter fidèlement les résultats calculés par le serveur.

Elles ne doivent jamais influencer le résultat du combat.

## 18.2 Déplacement

Lors d'un déplacement :

- Le personnage se déplace vers sa destination.
- L'animation reste fluide.
- Les deux déplacements sont représentés simultanément.

Si les déplacements sont annulés pour cause de chevauchement final, les personnages restent à leur position initiale.

## 18.3 Attaques

Chaque attaque possède une animation visuelle distincte.

**SWEEP**

- Effet large et rapide.
- Arc visuel de 180°.

**STRIKE**

- Effet directionnel intermédiaire.
- Arc visuel de 90°.

**SNIPER**

- Effet précis.
- Ligne ou projectile directionnel étroit.

## 18.4 Dégâts

Lorsqu'un joueur reçoit des dégâts :

- La barre de vie se met à jour.
- Une animation de réaction peut être jouée.
- Le nombre de dégâts peut apparaître brièvement.

## 18.5 Élimination

Lorsqu'un personnage est éliminé :

- Jouer une animation courte.
- Afficher clairement son élimination.
- Préparer l'écran de résultat si la partie est terminée.

---

# 19. Résultat d'une partie

## 19.1 Objectif

Présenter clairement le résultat final.

## 19.2 Victoire

Afficher :

- VICTORY.
- Pseudonyme du joueur gagnant.
- Points de vie restants.
- Nombre de tours joués.

## 19.3 Défaite

Afficher :

- DEFEAT.
- Pseudonyme de l'adversaire.
- Points de vie finaux.
- Nombre de tours joués.

## 19.4 Match nul

Afficher :

- DRAW.
- Résultat des deux joueurs.
- Nombre de tours joués.

## 19.5 Actions disponibles

Boutons :

- PLAY AGAIN.
- BACK TO MENU.

Le bouton PLAY AGAIN peut relancer un nouveau matchmaking ou proposer la création d'une nouvelle partie privée selon le contexte.

---

# 20. Profil et statistiques

## 20.1 Objectif

Permettre au joueur de consulter ses statistiques.

## 20.2 Informations

Afficher :

- Pseudonyme.
- Parties jouées.
- Victoires.
- Défaites.
- Matchs nuls.
- Taux de victoire.

## 20.3 Présentation

Les statistiques doivent être simples et lisibles.

Un système de classement avancé n'est pas nécessaire dans le MVP.

---

# 21. Paramètres

## 21.1 Paramètres disponibles

Le menu Settings doit proposer :

- Volume général.
- Volume des effets sonores.
- Volume de la musique.
- Activation ou désactivation des animations supplémentaires.
- Qualité graphique, si nécessaire.
- Langue de l'interface.

## 21.2 Sauvegarde

Les préférences locales peuvent être conservées dans le navigateur.

Aucune donnée sensible ne doit être stockée dans le stockage local.

---

# 22. Langues et internationalisation

## 22.1 Décision validée

**HEX DUEL est bilingue français / anglais.**

Les deux langues doivent être disponibles dès le MVP.

## 22.2 Langue par défaut

La langue initiale peut être déterminée à partir des préférences linguistiques du navigateur.

Si la langue du navigateur n'est ni le français ni l'anglais, l'anglais est utilisé par défaut.

Le joueur peut modifier manuellement la langue à tout moment.

## 22.3 Sélecteur de langue

Un sélecteur simple doit être accessible depuis :

- L'écran d'accueil.
- Le menu Settings.

Les options proposées sont :

- Français (FR).
- English (EN).

## 22.4 Traductions

Tous les textes visibles doivent être traduisibles :

- Menus.
- Boutons.
- Messages d'erreur.
- États de connexion.
- Notifications.
- Instructions.
- Résultats.
- Paramètres.

Aucun texte d'interface ne doit être codé directement dans un composant Vue lorsqu'il doit être traduit.

## 22.5 Organisation technique

Le système d'internationalisation doit être centralisé.

Les fichiers de traduction doivent être séparés par langue.

Organisation indicative :

```text
app/
└── i18n/
    ├── locales/
    │   ├── fr.json
    │   └── en.json
    └── config.ts
```

Les clés de traduction doivent être cohérentes entre les deux fichiers.

## 22.6 Langue des données joueur

Les pseudonymes des joueurs ne sont pas traduits.

Les identifiants techniques, les types d'actions et les messages réseau restent indépendants de la langue de l'interface.

Les messages d'erreur doivent être associés à des codes techniques afin que le frontend puisse afficher leur traduction.

---

# 23. Retours sonores

## 23.1 Sons prévus

Le jeu peut intégrer des sons courts pour :

- Sélection d'une action.
- Validation.
- Début du tour.
- Compte à rebours.
- Attaque.
- Dégâts.
- Élimination.
- Victoire.
- Défaite.

## 23.2 Contrôle

Tous les sons doivent pouvoir être désactivés.

Le jeu ne doit pas imposer la lecture audio.

Les sons doivent rester discrets.

---

# 24. États de chargement et erreurs

## 24.1 Chargement

Prévoir des états visuels pour :

- Connexion au serveur.
- Recherche d'un adversaire.
- Création d'un salon.
- Rejoindre un salon.
- Chargement de l'arène 3D.
- Reconnexion.

## 24.2 Erreurs

Les messages doivent être compréhensibles et disponibles dans les deux langues.

Exemples :

- Impossible de se connecter au serveur / Unable to connect to server.
- Salon introuvable / Room not found.
- Salon complet / Room is full.
- Code d'invitation invalide / Invalid invitation code.
- Connexion interrompue / Connection lost.
- Reconnexion impossible / Reconnection failed.

## 24.3 Déconnexion

Lorsqu'une connexion est interrompue :

- Afficher un indicateur de déconnexion.
- Afficher une tentative de reconnexion.
- Afficher le temps restant si cette information est disponible.
- Restaurer l'interface après reconnexion.

---

# 25. Responsive design

## 25.1 Desktop

Le desktop est la plateforme prioritaire du MVP.

L'interface privilégie :

- Une arène large.
- Un HUD compact.
- Des contrôles précis à la souris.
- Une bonne lisibilité des informations.

## 25.2 Tablette

L'interface doit s'adapter à une largeur intermédiaire.

Les contrôles peuvent être repositionnés sous l'arène.

## 25.3 Mobile

L'interface doit être utilisable sur smartphone.

Prévoir :

- Une arène adaptée à la largeur disponible.
- Des boutons suffisamment grands.
- Des contrôles tactiles.
- Un HUD compact.
- Une disposition verticale.

Les interactions tactiles doivent reproduire les possibilités des contrôles souris.

Le gameplay doit rester compréhensible sans masquer les informations essentielles.

---

# 26. Accessibilité et lisibilité

L'interface doit respecter les principes suivants :

- Contrastes suffisants.
- Texte lisible.
- Boutons clairement identifiables.
- États sélectionnés visibles autrement que par la couleur seule.
- Informations importantes non dépendantes uniquement des effets lumineux.
- Contrôles utilisables au clavier lorsque cela est pertinent.
- Réduction des animations lorsque le système ou l'utilisateur le demande.
- Interface correctement traduite dans les deux langues.

Les couleurs rouge et bleu doivent être accompagnées d'autres éléments distinctifs pour rester identifiables en cas de difficulté de perception des couleurs.

---

# 27. Architecture des composants UI

Les composants doivent être réutilisables.

Principes :

1. Un composant doit avoir une responsabilité claire.
2. La logique réseau ne doit pas être mélangée au rendu graphique.
3. La logique de gameplay ne doit pas être intégrée dans les composants UI.
4. Les états visuels doivent être pilotés par des données explicites.
5. Les composants doivent être typés avec TypeScript.
6. Les composants de l'arène 3D doivent être isolés du reste de l'application.
7. Les textes doivent utiliser le système centralisé de traduction.

La structure exacte des composants peut évoluer pendant le développement.

---

# 28. Critères de validation UI/UX

L'interface est considérée comme fonctionnelle lorsque :

1. Le joueur peut accéder à l'écran d'accueil.
2. Il peut choisir Quick Match ou Private Room.
3. Il peut créer et rejoindre un salon privé.
4. Il peut visualiser les deux personnages dans une arène 3D.
5. Il peut consulter les points de vie et le timer.
6. Il peut sélectionner une action.
7. Il peut choisir une destination de déplacement avec la souris.
8. Il peut orienter une attaque indépendamment de son déplacement.
9. La caméra reste isométrique et fixe.
10. Il peut valider son action.
11. Il ne peut pas voir l'action adverse avant résolution.
12. Il peut visualiser les animations de résolution.
13. Il peut consulter le résultat final.
14. Il peut consulter ses statistiques.
15. Il peut gérer ses paramètres audio.
16. Il peut changer la langue entre français et anglais.
17. L'interface gère les états de connexion et de reconnexion.
18. Les écrans principaux sont utilisables sur desktop et adaptés au mobile.

---

# 29. Hors périmètre UI/UX du MVP

Les éléments suivants ne sont pas prévus dans la première version :

- Chat intégré.
- Liste d'amis.
- Classements avancés.
- Boutique.
- Personnalisation des personnages.
- Système de récompenses.
- Système de missions.
- Notifications sociales.
- Spectateurs.
- Replays.
- Tutoriel interactif avancé.

Ces fonctionnalités pourront être étudiées ultérieurement.

---

**Fin du document — HEX DUEL UI / UX SPECIFICATION v1.1**

---

# 30. Système de bonus — affichage

## 30.1 Bonus au sol (rendu 3D)

- Chaque bonus au sol apparaît EN LÉVITATION au-dessus de l'arène, avec un petit marqueur au sol à la position du bonus, de la couleur du modèle.
- Le tour de son apparition, le modèle est opaque/normal ; au tour suivant (dernier avant disparition), il devient légèrement translucide.
- Assets : `bonus-crystal.glb` (régénération), `bonus-move.glb` (déplacement), `bonus-atk.glb` (attaque), `bonus-shield.glb` (bouclier).

## 30.2 Bonus armé (HUD)

- L'icône 2D du bonus armé est affichée SOUS LE NOM du joueur qui le porte, visible par les deux joueurs.
- Icônes : `bonus-crystal.png`, `bonus-move.png`, `bonus-atk.png`, `bonus-shield.png`.
- Régénération : pas d'icône (effet immédiat).
- Quand le bonus est consommé, l'icône disparaît.

## 30.3 Régénération et cristaux

Lorsqu'un joueur récupère un cristal via la régénération, le dernier cristal perdu est remplacé par le cristal vert (`crystal-green-hex.png`) dans l'affichage du joueur.

## 30.4 Textes

Tous les textes visibles liés aux bonus passent par le système centralisé de traduction FR/EN (D-164).
