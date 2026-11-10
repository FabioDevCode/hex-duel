import { computed, onMounted } from "vue";
import { useCookie, useState } from "nuxt/app";

export type Locale = "fr" | "en";

const messages: Record<Locale, Record<string, string>> = {
  en: {
    "nav.play": "Play",
    "nav.profile": "Profile",
    "home.tagline": "Duel your opponent on the arena.",
    "home.play": "PLAY",
    "home.credits": "CREDITS",
    "play.quickMatch": "QUICK MATCH",
    "play.quickMatchDesc": "Find an opponent automatically.",
    "play.privateRoom": "PRIVATE ROOM",
    "play.privateRoomDesc": "Create or join a private room with a code.",
    "matchmaking.searching": "Searching for an opponent...",
    "matchmaking.cancel": "CANCEL",
    "room.create": "CREATE ROOM",
    "room.join": "JOIN",
    "room.code": "Invitation code",
    "room.waiting": "WAITING FOR OPPONENT",
    "room.copy": "COPY",
    "room.copied": "Copied!",
    "room.invalidCode": "Invalid or expired code.",
    "room.roomFull": "This room is full.",
    "room.back": "BACK",
    "game.turn": "TURN {turn} / {max}",
    "bonus.REGEN": "Regeneration",
    "bonus.ATTACK": "Attack boost",
    "bonus.MOVE": "Movement boost",
    "bonus.SHIELD": "Shield",
    "howto.title": "How to play",
    "howto.close": "Close",
    "howto.prev": "Previous",
    "howto.next": "Next",
    "howto.concept": "HEX DUEL is a duel between two fighters on a hexagonal arena. Each turn, you secretly choose one action; when both players are ready, the actions resolve simultaneously. The first fighter to lose all their crystals loses the duel.",
    "howto.turnsTitle": "Turns",
    "howto.turns": "You have 30 seconds to choose and confirm your action. Your choice stays secret until both players have confirmed. If a player runs out of time, their action becomes a PASS. When both players attack, the action confirmed first is resolved first.",
    "howto.actionsTitle": "Actions",
    "howto.moveTitle": "Move",
    "howto.move": "Move your fighter up to 5 units in any direction. The move can also collect a bonus by crossing its zone.",
    "howto.strikeTitle": "Strike (short attack)",
    "howto.strike": "A wide close-range hit: range 6, 90-degree cone. Each successful hit destroys one enemy crystal. Its zone can also collect bonuses.",
    "howto.sniperTitle": "Sniper (long attack)",
    "howto.sniper": "A narrow long-range thrust: range 10, 10-degree cone. Each successful hit destroys one enemy crystal. Its zone can also collect bonuses.",
    "howto.giveupTitle": "Give up",
    "howto.giveup": "Surrender the duel: your opponent is declared the winner. A confirmation is required.",
    "howto.crystalsTitle": "Crystals",
    "howto.crystals": "Each fighter starts with 3 crystals. Every successful attack destroys exactly one crystal; the broken crystal turns black. At 0 crystals you are eliminated. After 30 turns, the fighter with the most crystals wins. A green crystal has been restored by a Regeneration bonus.",
    "howto.bonusTitle": "Bonuses",
    "howto.bonusIntro": "Bonuses appear on the arena during the duel and are collected automatically. Only one armed bonus at a time (Regeneration excepted): a new one replaces the old. An armed bonus stays until it is used.",
    "howto.bonus.regen": "Immediately restores one crystal (up to 3). Does nothing if you already have all your crystals, and does not use the armed slot.",
    "howto.bonus.attack": "Boosts your next attack: Strike becomes range 8 / 180 degrees, Sniper becomes range 12 / 25 degrees. Consumed by that single attack.",
    "howto.bonus.move": "Boosts your next move: range 5 becomes 7. Consumed by that single move.",
    "howto.bonus.shield": "Absorbs the next hit you receive: the crystal is not destroyed. Consumed by that hit.",
    "howto.bonus.pickup": "Three ways to collect a bonus: finish your move on its zone, cross its zone during your move, or cover it with the zone of your attack. If both players collect the same bonus on the same turn, nobody gets it. A bonus left on the ground disappears after two turns.",
    "game.confirm": "CONFIRM",
    "game.actionLocked": "ACTION LOCKED",
    "game.opponentChoosing": "OPPONENT CHOOSING",
    "game.opponentReady": "OPPONENT READY",
    "game.waitingTurn": "Waiting for turn resolution...",
    "game.move": "MOVE",
    "game.strike": "STRIKE",
    "game.sniper": "SNIPER",
    "game.pass": "PASS",
    "game.you": "You",
    "game.opponent": "Opponent",
    "surrender.title": "SURRENDER",
    "surrender.text": "Are you sure you want to surrender this match ?",
    "surrender.confirm": "YES, SURRENDER",
    "surrender.cancel": "CANCEL",
    "result.victory": "VICTORY",
    "result.defeat": "DEFEAT",
    "result.draw": "DRAW",
    "result.playAgain": "PLAY AGAIN",
    "result.backToMenu": "QUIT GAME",
    "error.connection": "Connection error. Is the server running?",
    "profile.matches": "MATCHES",
    "profile.wins": "WINS",
    "profile.losses": "LOSSES",
    "profile.draws": "DRAWS",
    "profile.noData": "Play a match to see your statistics.",
    "profile.pseudonym": "PSEUDONYM",
    "profile.pseudonymChange": "CHANGE YOUR PSEUDO",
    "profile.pseudonymSave": "SAVE",
    "profile.pseudonymSaved": "Pseudonym saved!",
    "profile.pseudonymInvalid": "3 to 24 characters: letters, digits, spaces, - and _ only.",
  },
  fr: {
    "nav.play": "Jouer",
    "nav.profile": "Profil",
    "home.tagline": "Affrontez votre adversaire en duel.",
    "home.play": "JOUER",
    "home.credits": "CRÉDITS",
    "play.quickMatch": "MATCH RAPIDE",
    "play.quickMatchDesc": "Trouvez automatiquement un adversaire.",
    "play.privateRoom": "SALON PRIVÉ",
    "play.privateRoomDesc": "Créez ou rejoignez un salon privé avec un code.",
    "matchmaking.searching": "Recherche d'un adversaire...",
    "matchmaking.cancel": "ANNULER",
    "room.create": "CRÉER UN SALON",
    "room.join": "REJOINDRE",
    "room.code": "Code d'invitation",
    "room.waiting": "EN ATTENTE DE L'ADVERSAIRE",
    "room.copy": "COPIER",
    "room.copied": "Copié !",
    "room.invalidCode": "Code invalide ou expiré.",
    "room.roomFull": "Ce salon est complet.",
    "room.back": "RETOUR",
    "game.turn": "TOUR {turn} / {max}",
    "bonus.REGEN": "Régénération",
    "bonus.ATTACK": "Boost d'attaque",
    "bonus.MOVE": "Boost de déplacement",
    "bonus.SHIELD": "Bouclier",
    "howto.title": "Comment jouer ?",
    "howto.close": "Fermer",
    "howto.prev": "Précédent",
    "howto.next": "Suivant",
    "howto.concept": "HEX DUEL est un duel entre deux combattants sur une arène hexagonale. À chaque tour, vous choisissez secrètement une action ; quand les deux joueurs sont prêts, les actions se résolvent simultanément. Le premier combattant à perdre tous ses cristaux perd le duel.",
    "howto.turnsTitle": "Les tours",
    "howto.turns": "Vous disposez de 30 secondes pour choisir et valider votre action. Votre choix reste secret jusqu'à la validation des deux joueurs. Si le temps expire, votre action devient un PASS. Si les deux joueurs attaquent, l'action validée en premier est résolue en premier.",
    "howto.actionsTitle": "Les actions",
    "howto.moveTitle": "Déplacement",
    "howto.move": "Déplacez votre combattant jusqu'à 5 unités dans n'importe quelle direction. Le déplacement peut aussi ramasser un bonus en traversant sa zone.",
    "howto.strikeTitle": "Strike (attaque courte)",
    "howto.strike": "Un coup large de courte portée : portée 6, cône de 90°. Chaque coup réussi détruit un cristal adverse. Sa zone peut également ramasser les bonus.",
    "howto.sniperTitle": "Sniper (attaque longue)",
    "howto.sniper": "Une estocade étroite de longue portée : portée 10, cône de 10°. Chaque coup réussi détruit un cristal adverse. Sa zone peut également ramasser les bonus.",
    "howto.giveupTitle": "Abandon",
    "howto.giveup": "Abandonne le duel : votre adversaire est déclaré vainqueur. Une confirmation est demandée.",
    "howto.crystalsTitle": "Les cristaux",
    "howto.crystals": "Chaque combattant démarre avec 3 cristaux. Chaque attaque réussie détruit exactement un cristal ; le cristal brisé devient noir. À 0 cristal vous êtes éliminé. Au bout de 30 tours, le combattant ayant le plus de cristaux l'emporte. Un cristal vert a été restauré par un bonus de régénération.",
    "howto.bonusTitle": "Les bonus",
    "howto.bonusIntro": "Des bonus apparaissent sur l'arène pendant le duel et se ramassent automatiquement. Un seul bonus armé à la fois (régénération exceptée) : un nouveau remplace l'ancien. Un bonus armé persiste jusqu'à son utilisation.",
    "howto.bonus.regen": "Restaure immédiatement un cristal (maximum 3). Sans effet si vous avez déjà tous vos cristaux, et n'occupe pas l'emplacement armé.",
    "howto.bonus.attack": "Booste votre prochaine attaque : le Strike passe à portée 8 / 180°, le Sniper à portée 12 / 25°. Consommé par cette seule attaque.",
    "howto.bonus.move": "Booste votre prochain déplacement : la portée passe de 5 à 7. Consommé par ce seul déplacement.",
    "howto.bonus.shield": "Absorbe le prochain coup reçu : le cristal n'est pas détruit. Consommé par ce coup.",
    "howto.bonus.pickup": "Trois façons de ramasser un bonus : terminer son déplacement sur sa zone, traverser sa zone pendant son déplacement, ou la couvrir avec la zone de son attaque. Si les deux joueurs ramassent le même bonus le même tour, personne ne l'obtient. Un bonus laissé au sol disparaît au bout de deux tours.",
    "game.confirm": "VALIDER",
    "game.actionLocked": "ACTION VERROUILLÉE",
    "game.opponentChoosing": "ADVERSAIRE EN COURS DE SÉLECTION",
    "game.opponentReady": "ADVERSAIRE PRÊT",
    "game.waitingTurn": "En attente de la résolution du tour...",
    "game.move": "DÉPLACEMENT",
    "game.strike": "STRIKE",
    "game.sniper": "SNIPER",
    "game.pass": "PASS",
    "game.you": "Vous",
    "game.opponent": "Adversaire",
    "surrender.title": "ABANDONNER",
    "surrender.text": "Êtes-vous sûr de vouloir abandonner cette partie ?",
    "surrender.confirm": "OUI, ABANDONNER",
    "surrender.cancel": "ANNULER",
    "result.victory": "VICTOIRE",
    "result.defeat": "DÉFAITE",
    "result.draw": "MATCH NUL",
    "result.playAgain": "REJOUER",
    "result.backToMenu": "QUITTER",
    "error.connection": "Erreur de connexion. Le serveur est-il démarré ?",
    "profile.matches": "PARTIES",
    "profile.wins": "VICTOIRES",
    "profile.losses": "DÉFAITES",
    "profile.draws": "NULS",
    "profile.noData": "Jouez une partie pour voir vos statistiques.",
    "profile.pseudonym": "PSEUDO",
    "profile.pseudonymChange": "CHANGER DE PSEUDO",
    "profile.pseudonymSave": "ENREGISTRER",
    "profile.pseudonymSaved": "Pseudo enregistré !",
    "profile.pseudonymInvalid": "3 à 24 caractères : lettres, chiffres, espaces, - et _ uniquement.",
  },
};

const STORAGE_KEY = "hex-duel-locale";
const LOCALE_COOKIE = "hex-duel-locale";

const isLocale = (value: unknown): value is Locale => value === "fr" || value === "en";

export const useI18n = () => {
  // Request-scoped on the server, shared across components on the client.
  const locale = useState<Locale>("hex-duel-locale", () => "en");
  // The cookie is shared between SSR and the client, so the server renders
  // the same locale the client hydrates with. Without it the whole page
  // text mismatches during hydration, which crashes Safari in Vue's
  // mismatch recovery (renderSlot with a null currentRenderingInstance).
  const cookie = useCookie<Locale | null>(LOCALE_COOKIE, {
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  if (isLocale(cookie.value)) {
    locale.value = cookie.value;
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = messages[locale.value] ?? messages.en;
    const template = dict[key] ?? messages.en[key] ?? key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_m, name: string) =>
      String(params[name] ?? `{${name}}`),
    );
  };

  const setLocale = (value: Locale): void => {
    locale.value = value;
    cookie.value = value;
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, value);
  };

  // First visit (no cookie yet): only detect the browser preference after
  // hydration so the initial client render matches the server-rendered DOM.
  if (import.meta.client) {
    onMounted(() => {
      if (isLocale(cookie.value)) return;
      const stored = localStorage.getItem(STORAGE_KEY);
      const detected = isLocale(stored)
        ? stored
        : navigator.language.toLowerCase().startsWith("fr")
          ? "fr"
          : "en";
      setLocale(detected);
    });
  }

  return { t, locale: computed(() => locale.value), setLocale };
};
