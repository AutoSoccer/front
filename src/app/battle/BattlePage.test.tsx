import "@/__tests__/mocks/router";
import {
  installLocalStorageMock,
  resetLocalStorageMock,
  seedLocalStorage,
} from "@/__tests__/mocks/localStorage";
import {
  renderWithProviders,
  screen,
  waitFor,
} from "@/__tests__/utils/renderWithProviders";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { BattleStreamState } from "@/hooks/useBattleStream";
import type { PlayMatchResponse } from "@/services/gameService";

// vi.hoisted garante que os mocks ficam disponiveis dentro dos factories de vi.mock
const { mockPlayMatch, mockConnect, mockDisconnect } = vi.hoisted(() => ({
  mockPlayMatch: vi.fn<() => Promise<PlayMatchResponse>>(),
  mockConnect: vi.fn(),
  mockDisconnect: vi.fn(),
}));

let mockWsState: BattleStreamState = { status: "idle" };

vi.mock("@/services/gameService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/gameService")>();
  return {
    ...actual,
    gameService: { ...actual.gameService, playMatch: mockPlayMatch },
  };
});

vi.mock("@/hooks/useBattleStream", () => ({
  useBattleStream: vi.fn(() => ({
    state: mockWsState,
    connect: mockConnect,
    disconnect: mockDisconnect,
  })),
}));

// Precisa ser importado apos vi.mock para pegar a versao mockada
// eslint-disable-next-line import/first
import BattlePage from "./BattlePage";

const SESSION_KEY = "autosoccer-game-session";
const TOKEN_KEY = "token";

function makeSession(athleteIds: Array<string | null> = [null, null, null, null, null, null]) {
  return JSON.stringify({
    coins: 1000,
    currentBattle: 1,
    victories: 0,
    losses: 0,
    lives: 5,
    selectedAthleteIds: athleteIds,
  });
}

function makeMatchResponse(overrides?: Partial<PlayMatchResponse>): PlayMatchResponse {
  return {
    winner: "player",
    score: { player: 1, opponent: 0 },
    totalTurns: 12,
    events: [],
    initialBall: { position: { x: 0, y: 0 }, athleteName: "", team: "player" },
    lineups: {
      player: { name: "Meu Time", positions: [[], [], []] },
      opponent: { name: "Adversario", positions: [[], [], []] },
    },
    resolution: {
      matchEnded: false,
      coins: 1100,
      coinsEarned: 100,
      trophiesDelta: 0,
    },
    persisted: { round: 2, victory: 1, lose: 0 },
    matchId: undefined,
    wsUrl: undefined,
    ...overrides,
  } as unknown as PlayMatchResponse;
}

beforeAll(() => installLocalStorageMock());

beforeEach(() => {
  resetLocalStorageMock();
  mockPlayMatch.mockReset();
  mockConnect.mockReset();
  mockDisconnect.mockReset();
  mockWsState = { status: "idle" };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BattlePage", () => {
  it("exibe estado de aguardando durante carregamento da partida", () => {
    mockPlayMatch.mockReturnValue(new Promise(() => {})); // pendente
    seedLocalStorage({
      [SESSION_KEY]: makeSession(["1", "2", "3", null, null, null]),
      [TOKEN_KEY]: "jwt-token",
    });

    renderWithProviders(<BattlePage />);

    expect(screen.getByText(/Aguardando/i)).toBeInTheDocument();
  });

  it("exibe mensagem de erro quando nenhum atleta esta escalado", async () => {
    seedLocalStorage({
      [SESSION_KEY]: makeSession(), // todos null
    });

    // playMatch nao deve ser chamado - mas precisamos evitar chamada real
    mockPlayMatch.mockResolvedValue(makeMatchResponse());

    renderWithProviders(<BattlePage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Escale ao menos 1 atleta/i)
      ).toBeInTheDocument();
    });
  });

  it("chama wsConnect quando resposta tem matchId e token existe", async () => {
    const response = makeMatchResponse({ matchId: "uuid-123", wsUrl: "/ws/battle/uuid-123" });
    mockPlayMatch.mockResolvedValue(response);
    seedLocalStorage({
      [SESSION_KEY]: makeSession(["1", "2", "3", null, null, null]),
      [TOKEN_KEY]: "jwt-token",
    });

    renderWithProviders(<BattlePage />);

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledWith("uuid-123", "jwt-token", response);
    });
  });

  it("nao chama wsConnect quando resposta nao tem matchId", async () => {
    const response = makeMatchResponse({ matchId: undefined });
    mockPlayMatch.mockResolvedValue(response);
    seedLocalStorage({
      [SESSION_KEY]: makeSession(["1", "2", "3", null, null, null]),
      [TOKEN_KEY]: "jwt-token",
    });

    renderWithProviders(<BattlePage />);

    await waitFor(() => {
      // Aguarda fim do loading (isWaitingForRound = false)
      expect(screen.queryByText(/Aguardando/i)).not.toBeInTheDocument();
    });

    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("nao chama wsConnect quando token nao esta disponivel", async () => {
    const response = makeMatchResponse({ matchId: "uuid-456" });
    mockPlayMatch.mockResolvedValue(response);
    seedLocalStorage({
      [SESSION_KEY]: makeSession(["1", "2", "3", null, null, null]),
      // sem token no localStorage
    });

    renderWithProviders(<BattlePage />);

    await waitFor(() => {
      expect(screen.queryByText(/Aguardando/i)).not.toBeInTheDocument();
    });

    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("exibe badge de conectando quando wsState e connecting", () => {
    mockWsState = { status: "connecting" };
    mockPlayMatch.mockReturnValue(new Promise(() => {}));
    seedLocalStorage({
      [SESSION_KEY]: makeSession(["1", "2", "3", null, null, null]),
    });

    renderWithProviders(<BattlePage />);

    expect(screen.getByText(/Conectando ao servidor/i)).toBeInTheDocument();
  });

  it("exibe badge ao vivo com numero do turno quando wsState e streaming", () => {
    mockWsState = {
      status: "streaming",
      events: [],
      currentTurn: 5,
    };
    mockPlayMatch.mockReturnValue(new Promise(() => {}));
    seedLocalStorage({
      [SESSION_KEY]: makeSession(["1", "2", "3", null, null, null]),
    });

    renderWithProviders(<BattlePage />);

    expect(screen.getByText(/AO VIVO/i)).toBeInTheDocument();
  });
});
