import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createDefaultGameSession,
  INITIAL_COINS,
  INITIAL_LIVES,
  readGameSession,
  resetGameSession,
  writeGameSession,
} from "./gameSession";

const STORAGE_KEY = "autosoccer-game-session";

describe("gameSession", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createDefaultGameSession", () => {
    it("retorna estrutura inicial com valores padrao", () => {
      const session = createDefaultGameSession();

      expect(session.coins).toBe(INITIAL_COINS);
      expect(session.currentBattle).toBe(1);
      expect(session.victories).toBe(0);
      expect(session.losses).toBe(0);
      expect(session.lives).toBe(INITIAL_LIVES);
      expect(session.selectedAthleteIds).toHaveLength(9);
      expect(session.selectedAthleteIds.every((id) => id === null)).toBe(true);
    });
  });

  describe("readGameSession", () => {
    it("retorna default quando localStorage esta vazio", () => {
      const session = readGameSession();
      expect(session).toEqual(createDefaultGameSession());
    });

    it("retorna sessao normalizada quando JSON valido", () => {
      const stored = {
        coins: 25,
        currentBattle: 3,
        victories: 2,
        losses: 1,
        lives: 4,
        selectedAthleteIds: ["10", "20", null, null, null, null, null, null, null],
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      const session = readGameSession();

      expect(session.coins).toBe(25);
      expect(session.currentBattle).toBe(3);
      expect(session.victories).toBe(2);
      expect(session.losses).toBe(1);
      expect(session.lives).toBe(4);
      expect(session.selectedAthleteIds[0]).toBe("10");
      expect(session.selectedAthleteIds[1]).toBe("20");
      expect(session.selectedAthleteIds[2]).toBeNull();
    });

    it("retorna default quando JSON invalido", () => {
      window.localStorage.setItem(STORAGE_KEY, "{invalido");

      const session = readGameSession();

      expect(session).toEqual(createDefaultGameSession());
    });
  });

  describe("writeGameSession", () => {
    it("persiste sessao no localStorage e retorna normalizada", () => {
      const session = createDefaultGameSession();
      session.coins = 99;
      session.victories = 5;

      const written = writeGameSession(session);

      expect(written.coins).toBe(99);
      expect(written.victories).toBe(5);

      const fromStorage = window.localStorage.getItem(STORAGE_KEY);
      expect(fromStorage).not.toBeNull();
      const parsed = JSON.parse(fromStorage as string);
      expect(parsed.coins).toBe(99);
      expect(parsed.victories).toBe(5);
    });

    it("normaliza valores invalidos (coins negativo vira 0, lives acima do max e clamped)", () => {
      const written = writeGameSession({
        coins: -10,
        currentBattle: 0,
        victories: -1,
        losses: -2,
        lives: 999,
        selectedAthleteIds: [],
      });

      expect(written.coins).toBe(0);
      expect(written.currentBattle).toBe(1);
      expect(written.victories).toBe(0);
      expect(written.losses).toBe(0);
      expect(written.lives).toBe(INITIAL_LIVES);
      expect(written.selectedAthleteIds).toHaveLength(9);
    });
  });

  describe("resetGameSession", () => {
    it("limpa storage e retorna default", () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ coins: 100, victories: 9, losses: 1, lives: 1, currentBattle: 5, selectedAthleteIds: [] }),
      );

      const session = resetGameSession();

      expect(session).toEqual(createDefaultGameSession());
      const fromStorage = window.localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(fromStorage as string);
      expect(parsed.coins).toBe(INITIAL_COINS);
      expect(parsed.victories).toBe(0);
    });
  });

  describe("normalizers internos (via readGameSession)", () => {
    it("converte ids numericos em string nos slots", () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ selectedAthleteIds: [42, 7, "abc", -1, 0, null, null, null, null] }),
      );

      const session = readGameSession();

      expect(session.selectedAthleteIds[0]).toBe("42");
      expect(session.selectedAthleteIds[1]).toBe("7");
      // string nao numerica vira null
      expect(session.selectedAthleteIds[2]).toBeNull();
      // negativos viram null
      expect(session.selectedAthleteIds[3]).toBeNull();
      // zero vira null (precisa ser > 0)
      expect(session.selectedAthleteIds[4]).toBeNull();
    });

    it("preenche slots ate 9 quando array curto", () => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ selectedAthleteIds: ["1", "2"] }),
      );

      const session = readGameSession();
      expect(session.selectedAthleteIds).toHaveLength(9);
      expect(session.selectedAthleteIds[0]).toBe("1");
      expect(session.selectedAthleteIds[2]).toBeNull();
    });

    it("retorna defaults quando campos numericos faltam", () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({}));

      const session = readGameSession();
      expect(session.coins).toBe(INITIAL_COINS);
      expect(session.lives).toBe(INITIAL_LIVES);
      expect(session.currentBattle).toBe(1);
    });
  });
});
