import { computed, ref } from "vue";

export type Locale = "fr" | "en";

const locale = ref<Locale>("en");

const messages: Record<Locale, Record<string, string>> = {
  en: {
    "nav.play": "Play",
    "nav.profile": "Profile",
    "home.tagline": "Duel your opponent on the hexagonal arena.",
    "home.play": "PLAY",
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
    "game.turn": "TURN {turn} / {max}",
    "game.confirm": "CONFIRM",
    "game.actionLocked": "ACTION LOCKED",
    "game.opponentChoosing": "OPPONENT CHOOSING",
    "game.opponentReady": "OPPONENT READY",
    "game.waitingTurn": "Waiting for turn resolution...",
    "game.move": "MOVE",
    "game.sweep": "SWEEP",
    "game.strike": "STRIKE",
    "game.sniper": "SNIPER",
    "game.pass": "PASS",
    "game.you": "You",
    "game.opponent": "Opponent",
    "result.victory": "VICTORY",
    "result.defeat": "DEFEAT",
    "result.draw": "DRAW",
    "result.playAgain": "PLAY AGAIN",
    "result.backToMenu": "BACK TO MENU",
    "error.connection": "Connection error. Is the server running?",
  },
  fr: {
    "nav.play": "Jouer",
    "nav.profile": "Profil",
    "home.tagline": "Affrontez votre adversaire sur l'arène hexagonale.",
    "home.play": "JOUER",
    "play.quickMatch": "QUICK MATCH",
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
    "game.turn": "TOUR {turn} / {max}",
    "game.confirm": "VALIDER",
    "game.actionLocked": "ACTION VERROUILLÉE",
    "game.opponentChoosing": "ADVERSAIRE EN COURS DE SÉLECTION",
    "game.opponentReady": "ADVERSAIRE PRÊT",
    "game.waitingTurn": "En attente de la résolution du tour...",
    "game.move": "DÉPLACEMENT",
    "game.sweep": "SWEEP",
    "game.strike": "STRIKE",
    "game.sniper": "SNIPER",
    "game.pass": "PASS",
    "game.you": "Vous",
    "game.opponent": "Adversaire",
    "result.victory": "VICTOIRE",
    "result.defeat": "DÉFAITE",
    "result.draw": "MATCH NUL",
    "result.playAgain": "REJOUER",
    "result.backToMenu": "RETOUR AU MENU",
    "error.connection": "Erreur de connexion. Le serveur est-il démarré ?",
  },
};

const STORAGE_KEY = "hex-duel-locale";

const detectLocale = (): Locale => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "fr" || stored === "en") return stored;
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith("fr")) return "fr";
  return "en";
};

export const useI18n = () => {
  if (import.meta.client && locale.value === "en" && !localStorage.getItem(STORAGE_KEY)) {
    locale.value = detectLocale();
    localStorage.setItem(STORAGE_KEY, locale.value);
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
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, value);
  };

  return { t, locale: computed(() => locale.value), setLocale };
};
