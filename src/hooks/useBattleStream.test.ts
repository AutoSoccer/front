import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MatchEvent, MatchResponse } from "@/services/gameService";
import { useBattleStream } from "./useBattleStream";

// A instancia criada pelo hook e capturada aqui para os testes poderem
// enviar mensagens simuladas sem precisar de referencia externa.
let lastWs: MockWebSocket;

class MockWebSocket {
  static readonly OPEN = 1;
  static readonly CONNECTING = 0;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  url: string;

  onopen: (() => void) | null = null;
  onmessage: ((ev: MessageEvent<string>) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onclose: (() => void) | null = null;

  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  });

  constructor(url: string) {
    this.url = url;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastWs = this;
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent<string>);
  }

  simulateError() {
    this.onerror?.({} as Event);
  }
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://localhost:3333";
  vi.stubGlobal("WebSocket", MockWebSocket);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_API_URL;
});

const makeMatchEvent = (turn: number): MatchEvent =>
  ({ turn, goal: false }) as unknown as MatchEvent;

const makeMatchResponse = (): MatchResponse =>
  ({
    events: [],
    score: { player: 1, opponent: 0 },
    winner: "player",
    totalTurns: 0,
  }) as unknown as MatchResponse;

describe("useBattleStream", () => {
  it("inicia no estado idle", () => {
    const { result } = renderHook(() => useBattleStream());
    expect(result.current.state.status).toBe("idle");
  });

  it("muda para connecting ao chamar connect e abre WebSocket correto", () => {
    const { result } = renderHook(() => useBattleStream());

    act(() => {
      result.current.connect("match-1", "token-abc");
    });

    expect(result.current.state.status).toBe("connecting");
    expect(lastWs.url).toBe(
      "ws://localhost:3333/ws/battle/match-1?token=token-abc"
    );
  });

  it("muda para streaming ao receber primeiro evento turn", () => {
    const { result } = renderHook(() => useBattleStream());

    act(() => {
      result.current.connect("match-1", "token-abc");
      lastWs.simulateMessage({ type: "turn", data: makeMatchEvent(1) });
    });

    expect(result.current.state.status).toBe("streaming");
    if (result.current.state.status === "streaming") {
      expect(result.current.state.currentTurn).toBe(1);
      expect(result.current.state.events).toHaveLength(1);
    }
  });

  it("acumula multiplos eventos de turno no estado streaming", () => {
    const { result } = renderHook(() => useBattleStream());

    act(() => {
      result.current.connect("match-1", "token-abc");
      lastWs.simulateMessage({ type: "turn", data: makeMatchEvent(1) });
      lastWs.simulateMessage({ type: "turn", data: makeMatchEvent(2) });
      lastWs.simulateMessage({ type: "turn", data: makeMatchEvent(3) });
    });

    if (result.current.state.status === "streaming") {
      expect(result.current.state.events).toHaveLength(3);
      expect(result.current.state.currentTurn).toBe(3);
    } else {
      throw new Error(`status inesperado: ${result.current.state.status}`);
    }
  });

  it("muda para finished ao receber resultado e preserva eventos acumulados", () => {
    const { result } = renderHook(() => useBattleStream());
    const fullResult = makeMatchResponse();

    act(() => {
      result.current.connect("match-1", "token-abc");
      lastWs.simulateMessage({ type: "turn", data: makeMatchEvent(1) });
      lastWs.simulateMessage({ type: "turn", data: makeMatchEvent(2) });
      lastWs.simulateMessage({ type: "result", data: fullResult });
    });

    expect(result.current.state.status).toBe("finished");
    if (result.current.state.status === "finished") {
      expect(result.current.state.result).toEqual(fullResult);
      expect(result.current.state.events).toHaveLength(2);
    }
  });

  it("muda para error ao receber mensagem de erro do servidor", () => {
    const { result } = renderHook(() => useBattleStream());
    const fallback = makeMatchResponse();

    act(() => {
      result.current.connect("match-1", "token-abc", fallback);
      lastWs.simulateMessage({ type: "error", data: { code: "UNAUTHORIZED" } });
    });

    expect(result.current.state.status).toBe("error");
    if (result.current.state.status === "error") {
      expect(result.current.state.fallbackResult).toBe(fallback);
    }
  });

  it("muda para error quando onerror dispara", () => {
    const { result } = renderHook(() => useBattleStream());
    const fallback = makeMatchResponse();

    act(() => {
      result.current.connect("match-1", "token-abc", fallback);
      lastWs.simulateError();
    });

    expect(result.current.state.status).toBe("error");
    if (result.current.state.status === "error") {
      expect(result.current.state.fallbackResult).toBe(fallback);
    }
  });

  it("usa wss quando protocolo da pagina e https", () => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, protocol: "https:" },
      configurable: true,
    });

    const { result } = renderHook(() => useBattleStream());
    act(() => {
      result.current.connect("match-1", "token-abc");
    });

    expect(lastWs.url).toContain("wss://");

    Object.defineProperty(window, "location", {
      value: { ...window.location, protocol: "http:" },
      configurable: true,
    });
  });

  it("fecha a conexao ao chamar disconnect", () => {
    const { result } = renderHook(() => useBattleStream());

    act(() => {
      result.current.connect("match-1", "token-abc");
    });
    act(() => {
      result.current.disconnect();
    });

    expect(lastWs.close).toHaveBeenCalled();
  });

  it("muda para error apos timeout quando socket nao abre", () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useBattleStream());

    act(() => {
      result.current.connect("match-1", "token-abc");
      // Simula socket preso em CONNECTING
      lastWs.readyState = MockWebSocket.CONNECTING;
    });

    act(() => {
      vi.advanceTimersByTime(5_001);
    });

    expect(result.current.state.status).toBe("error");

    vi.useRealTimers();
  });

  it("nao dispara timeout se socket abre antes do prazo", () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useBattleStream());

    act(() => {
      result.current.connect("match-1", "token-abc");
      // Simula abertura bem-sucedida: hook chama clearTimeout em onopen
      lastWs.readyState = MockWebSocket.OPEN;
      lastWs.onopen?.();
    });

    act(() => {
      vi.advanceTimersByTime(5_001);
    });

    // Sem mensagens do servidor: estado permanece connecting
    expect(result.current.state.status).toBe("connecting");

    vi.useRealTimers();
  });
});
