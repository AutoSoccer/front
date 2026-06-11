"use client";

import { useCallback, useRef, useState } from "react";

import type { MatchEvent, MatchResponse } from "@/services/gameService";

export type BattleStreamState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "streaming"; events: MatchEvent[]; currentTurn: number }
  | { status: "finished"; events: MatchEvent[]; result: MatchResponse }
  | { status: "error"; fallbackResult?: MatchResponse };

const WS_TIMEOUT_MS = 5_000;

export function useBattleStream() {
  const [state, setState] = useState<BattleStreamState>({ status: "idle" });
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(
    (matchId: string, token: string, fallbackResult?: MatchResponse) => {
      setState({ status: "connecting" });

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const base =
        process.env.NEXT_PUBLIC_API_URL?.replace(/^https?/, protocol) ??
        `${protocol}://localhost:3333`;

      const ws = new WebSocket(`${base}/ws/battle/${matchId}?token=${token}`);
      wsRef.current = ws;

      const events: MatchEvent[] = [];

      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setState({ status: "error", fallbackResult });
        }
      }, WS_TIMEOUT_MS);

      ws.onopen = () => clearTimeout(timeout);

      ws.onmessage = (msg: MessageEvent<string>) => {
        const parsed = JSON.parse(msg.data) as {
          type: "turn" | "result" | "error";
          data: unknown;
        };

        if (parsed.type === "turn") {
          events.push(parsed.data as MatchEvent);
          setState({
            status: "streaming",
            events: [...events],
            currentTurn: (parsed.data as MatchEvent).turn,
          });
        }

        if (parsed.type === "result") {
          const result = parsed.data as MatchResponse;
          setState({
            status: "finished",
            events: [...events],
            result,
          });
        }

        if (parsed.type === "error") {
          clearTimeout(timeout);
          setState({ status: "error", fallbackResult });
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        setState({ status: "error", fallbackResult });
      };

      ws.onclose = () => clearTimeout(timeout);
    },
    [],
  );

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  return { state, connect, disconnect };
}
