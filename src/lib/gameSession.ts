export const WINS_TO_FINISH = 10;
export const INITIAL_COINS = 10;
export const INITIAL_LIVES = 5;

const STORAGE_KEY = "autosoccer-game-session";
const BOARD_SLOT_COUNT = 9;

export type GameSession = {
  coins: number;
  currentBattle: number;
  victories: number;
  losses: number;
  lives: number;
  selectedAthleteIds: Array<string | null>;
};

export function createDefaultGameSession(): GameSession {
  return {
    coins: INITIAL_COINS,
    currentBattle: 1,
    victories: 0,
    losses: 0,
    lives: INITIAL_LIVES,
    selectedAthleteIds: Array.from({ length: BOARD_SLOT_COUNT }, () => null),
  };
}

function normalizeSelectedAthletes(value: unknown): Array<string | null> {
  if (!Array.isArray(value)) {
    return createDefaultGameSession().selectedAthleteIds;
  }

  return Array.from({ length: BOARD_SLOT_COUNT }, (_, index) => {
    const item = value[index];
    const raw = typeof item === "number" ? String(item) : item;
    const athleteId = typeof raw === "string" ? Number(raw) : NaN;
    return Number.isInteger(athleteId) && athleteId > 0 ? String(athleteId) : null;
  });
}

function normalizeSession(value: unknown): GameSession {
  const fallback = createDefaultGameSession();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const data = value as Partial<GameSession>;

  return {
    coins: typeof data.coins === "number" ? Math.max(0, data.coins) : fallback.coins,
    currentBattle:
      typeof data.currentBattle === "number"
        ? Math.max(1, data.currentBattle)
        : fallback.currentBattle,
    victories:
      typeof data.victories === "number" ? Math.max(0, data.victories) : fallback.victories,
    losses: typeof data.losses === "number" ? Math.max(0, data.losses) : fallback.losses,
    lives:
      typeof data.lives === "number"
        ? Math.min(INITIAL_LIVES, Math.max(0, data.lives))
        : fallback.lives,
    selectedAthleteIds: normalizeSelectedAthletes(data.selectedAthleteIds),
  };
}

export function readGameSession(): GameSession {
  if (typeof window === "undefined") {
    return createDefaultGameSession();
  }

  const storedSession = window.localStorage.getItem(STORAGE_KEY);
  if (!storedSession) {
    return createDefaultGameSession();
  }

  try {
    return normalizeSession(JSON.parse(storedSession));
  } catch {
    return createDefaultGameSession();
  }
}

export function writeGameSession(session: GameSession): GameSession {
  const nextSession = normalizeSession(session);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  }

  return nextSession;
}

export function resetGameSession(): GameSession {
  return writeGameSession(createDefaultGameSession());
}
