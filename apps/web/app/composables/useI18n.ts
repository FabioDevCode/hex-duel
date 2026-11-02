import { computed, onMounted } from "vue";
import { useCookie, useState } from "nuxt/app";

export type Locale = "fr" | "en";

const messages: Record<Locale, Record<string, string>> = {
  en: {
    "nav.play": "Play",
    "nav.profile": "Profile",
    "home.tagline": "Duel your opponent on the arena.",
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
    "game.strike": "STRIKE",
    "game.sniper": "SNIPER",
    "game.pass": "PASS",
    "game.you": "You",
    "game.opponent": "Opponent",
    "surrender.title": "SURRENDER?",
    "surrender.text": "Are you sure you want to surrender this match?",
    "surrender.confirm": "YES, SURRENDER",
    "surrender.cancel": "CANCEL",
    "result.victory": "VICTORY",
    "result.defeat": "DEFEAT",
    "result.draw": "DRAW",
    "result.playAgain": "PLAY AGAIN",
    "result.backToMenu": "BACK TO MENU",
    "error.connection": "Connection error. Is the server running?",
    "profile.matches": "MATCHES",
    "profile.wins": "WINS",
    "profile.losses": "LOSSES",
    "profile.draws": "DRAWS",
    "profile.noData": "Play a match to see your statistics.",
  },
  fr: {
    "nav.play": "Jouer",
    "nav.profile": "Profil",
    "home.tagline": "Affrontez votre adversaire en duel.",
    "home.play": "JOUER",
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
    "game.turn": "TOUR {turn} / {max}",
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
    "surrender.title": "ABANDONNER ?",
    "surrender.text": "Êtes-vous sûr de vouloir abandonner cette partie ?",
    "surrender.confirm": "OUI, ABANDONNER",
    "surrender.cancel": "ANNULER",
    "result.victory": "VICTOIRE",
    "result.defeat": "DÉFAITE",
    "result.draw": "MATCH NUL",
    "result.playAgain": "REJOUER",
    "result.backToMenu": "RETOUR AU MENU",
    "error.connection": "Erreur de connexion. Le serveur est-il démarré ?",
    "profile.matches": "PARTIES",
    "profile.wins": "VICTOIRES",
    "profile.losses": "DÉFAITES",
    "profile.draws": "NULS",
    "profile.noData": "Jouez une partie pour voir vos statistiques.",
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
