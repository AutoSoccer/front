"use client";

import {
  FlagFilled,
  TeamOutlined,
  TrophyFilled,
  UserOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ProfileCorner from "@/components/ProfileCorner";
import api from "@/providers/api";

import styles from "./BattlePage.module.css";

// ----------------------------------------------------------------------------
// Tipos do payload do backend (POST /partida/jogar-rodada — Tasks 4.3/4.5/4.6)
// ----------------------------------------------------------------------------
type Possession = "player" | "opponent";
type DisputeKind = "pass" | "tackle" | "shot" | "turnover";
type MatchStatus = "in_progress" | "won" | "lost";

type ApiAthlete = {
  id: number;
  name: string;
  velocity: number;
  attack: number;
  defense: number;
} | null;

type ApiTeam = {
  id: number;
  name: string;
  athletesPositions: ApiAthlete[][];
};

type ApiEvent = {
  turn: number;
  possession: Possession;
  ballRow: number;
  kind: DisputeKind;
  attackerName: string | null;
  defenderName: string | null;
  success: boolean;
  goal: boolean;
  description: string;
};

type ApiResolution = {
  matchStatus: MatchStatus;
  matchEnded: boolean;
  trophiesDelta: number;
  trophies: number;
  userVictory: number;
  userDefeat: number;
  isGuest: boolean;
  roundLogId: number;
};

type JogarRodadaResponse = {
  player: ApiTeam;
  opponent: ApiTeam;
  score: { player: number; opponent: number };
  winner: Possession | "draw";
  totalTurns: number;
  events: ApiEvent[];
  persisted: { teamId: number; victory: number; lose: number; round: number };
  resolution: ApiResolution;
};

// ----------------------------------------------------------------------------
// Constantes de ritmo da animacao (RF006)
// ----------------------------------------------------------------------------
const areaLabels = ["Defesa", "Centro", "Ataque"];
const FIRST_TURN_DELAY_MS = 650;
const TURN_INTERVAL_MS = 850;
const END_MODAL_DELAY_MS = 550;

type FieldToken = { name: string; overall: number } | null;

function buildField(team: ApiTeam | undefined): FieldToken[][] {
  const base: FieldToken[][] = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
  if (!team?.athletesPositions) {
    return base;
  }
  return base.map((row, r) =>
    row.map((_, c) => {
      const cell = team.athletesPositions[r]?.[c];
      if (!cell) {
        return null;
      }
      return {
        name: cell.name,
        overall: Math.round((cell.velocity + cell.attack + cell.defense) / 3),
      };
    })
  );
}

function formatClock(turn: number): string {
  const totalSeconds = turn * 8;
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function eventTitle(event: ApiEvent): string {
  if (event.goal) return "Gol!";
  if (event.kind === "shot") return "Chute defendido";
  if (event.kind === "tackle") return "Desarme";
  if (event.kind === "turnover") return "Perda de bola";
  return "Avanco";
}

function eventSideClass(event: ApiEvent): string {
  if (event.kind === "turnover") return styles.logItemNeutral;
  return event.possession === "player"
    ? styles.logItemPlayer
    : styles.logItemOpponent;
}

function scoreUpTo(events: ApiEvent[], lastIndex: number): string {
  let player = 0;
  let opponent = 0;
  for (let i = 0; i <= lastIndex && i < events.length; i += 1) {
    if (events[i].goal) {
      if (events[i].possession === "player") player += 1;
      else opponent += 1;
    }
  }
  return `${player}x${opponent}`;
}

function FieldPanel({
  title,
  subtitle,
  grid,
  mirrored = false,
}: {
  title: string;
  subtitle: string;
  grid: FieldToken[][];
  mirrored?: boolean;
}) {
  const rowOrder = mirrored ? [2, 1, 0] : [0, 1, 2];

  return (
    <section
      className={`${styles.fieldPanel} ${mirrored ? styles.fieldPanelMirrored : ""}`}
      aria-label={title}
    >
      <div className={styles.fieldHeader}>
        <span className={styles.teamIcon}>
          {mirrored ? <TeamOutlined /> : <UserOutlined />}
        </span>
        <div className={styles.teamText}>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
      </div>

      <div className={styles.fieldGoal} aria-hidden="true" />
      <div className={styles.fieldArc} aria-hidden="true" />
      <div className={styles.fieldCenterCircle} aria-hidden="true" />

      <div className={styles.fieldAreas}>
        {rowOrder.map((rowIndex) => (
          <div className={styles.fieldArea} key={`${title}-area-${rowIndex}`}>
            <span className={styles.areaLabel}>{areaLabels[rowIndex]}</span>
            <div className={styles.fieldSlotGrid}>
              {grid[rowIndex].map((token, col) => (
                <div
                  className={styles.fieldSlot}
                  key={`${title}-${rowIndex}-${col}`}
                >
                  {token ? (
                    <div className={styles.playerToken} title={`Overall ${token.overall}`}>
                      <span className={styles.playerIcon} aria-hidden="true">
                        &#9917;
                      </span>
                      <span>{token.name}</span>
                    </div>
                  ) : (
                    <span className={styles.emptyToken} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function BattlePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<JogarRodadaResponse | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);

  // 1) Ao montar, joga a rodada real no backend (matchmaking + motor + trofeus).
  useEffect(() => {
    let active = true;

    // Usa o snapshot salvo no mercado (formacao exata); senao o backend cria um.
    const snapshotIdRaw =
      typeof window !== "undefined"
        ? sessionStorage.getItem("autosoccer:snapshotId")
        : null;
    const body = snapshotIdRaw ? { snapshot_id: Number(snapshotIdRaw) } : {};
    if (snapshotIdRaw && typeof window !== "undefined") {
      // consome o snapshot — proxima partida exige nova formacao.
      sessionStorage.removeItem("autosoccer:snapshotId");
    }

    api
      .post<JogarRodadaResponse>("/partida/jogar-rodada", body)
      .then((response) => {
        if (!active) return;
        setData(response.data);
        setStatus("playing");
      })
      .catch((error: unknown) => {
        if (!active) return;
        const apiMessage = isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined;
        setErrorMessage(
          apiMessage ??
            "Nao foi possivel iniciar a rodada. Verifique se voce tem um time montado e tente novamente."
        );
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  // 2) RF006: revela os turnos um a um com temporizadores, simulando tempo real.
  useEffect(() => {
    if (status !== "playing" || !data) {
      return;
    }

    const events = data.events;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    if (events.length === 0) {
      // Defere para fora do corpo sincrono do effect (evita setState sincrono).
      const t = setTimeout(() => setIsEndModalOpen(true), 0);
      return () => clearTimeout(t);
    }

    events.forEach((_, index) => {
      const timer = setTimeout(
        () => {
          setVisibleCount(index + 1);
          if (index === events.length - 1) {
            const endTimer = setTimeout(
              () => setIsEndModalOpen(true),
              END_MODAL_DELAY_MS
            );
            timers.push(endTimer);
          }
        },
        FIRST_TURN_DELAY_MS + index * TURN_INTERVAL_MS
      );
      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [status, data]);

  const events = data?.events ?? [];
  const shown = events.slice(0, visibleCount);
  const lastShown = shown[shown.length - 1];
  const currentScore = visibleCount > 0 ? scoreUpTo(events, visibleCount - 1) : "0x0";
  const currentTurn = lastShown?.turn ?? 0;
  const totalTurns = data?.totalTurns ?? events.length;

  const playerField = useMemo(() => buildField(data?.player), [data]);
  const opponentField = useMemo(() => buildField(data?.opponent), [data]);

  const winner = data?.winner ?? "draw";
  const resolution = data?.resolution;
  const persisted = data?.persisted;
  const finalScore = data ? `${data.score.player}x${data.score.opponent}` : "0x0";
  // RN005: a rodada termina em Gol ou Empate 0x0.
  const roundOutcome = winner === "draw" ? "Empate 0x0" : "Gol";
  const resultLabel =
    winner === "player"
      ? "Vitoria na rodada"
      : winner === "opponent"
        ? "Derrota na rodada"
        : "Empate";
  const matchEnded = resolution?.matchEnded ?? false;
  const matchTitle =
    resolution?.matchStatus === "won"
      ? "Voce venceu a temporada!"
      : resolution?.matchStatus === "lost"
        ? "Temporada encerrada"
        : "Rodada concluida";
  const trophyDelta = resolution?.trophiesDelta ?? 0;
  const trophyPrefix = trophyDelta > 0 ? "+" : "";

  return (
    <main className={styles.main}>
      <span className={styles.brandFloating} aria-label="AutoSoccer">
        <img src="/logo.png" alt="AutoSoccer" />
      </span>
      <ProfileCorner />

      <div className={styles.battleShell}>
        <header className={styles.battleHeader}>
          <h1 className={styles.title}>Batalha</h1>
        </header>

        <section className={styles.matchHud} aria-label="Resumo da batalha">
          <div className={styles.hudItem}>
            <span className={styles.hudLabel}>Placar</span>
            <strong className={styles.scoreValue}>{currentScore}</strong>
          </div>
          <div className={styles.hudItem}>
            <span className={styles.hudLabel}>Turno</span>
            <strong className={styles.hudValue}>
              {currentTurn}/{totalTurns || 12}
            </strong>
          </div>
        </section>

        <section className={styles.arena} aria-label="Campo da partida">
          <FieldPanel
            title="Seu time"
            subtitle={data?.player.name ?? "Sua escalacao"}
            grid={playerField}
          />

          <div className={styles.centerBridge} aria-hidden="true">
            <div className={styles.bridgeCircle}>
              <FlagFilled />
              <strong>{currentScore}</strong>
            </div>
          </div>

          <FieldPanel
            title="Rival"
            subtitle={data?.opponent.name ?? "Adversario fantasma"}
            grid={opponentField}
            mirrored
          />
        </section>

        <section className={styles.logPanel} aria-labelledby="log-title">
          <div className={styles.logHeader}>
            <h2 id="log-title">Logs da rodada</h2>
            <span className={styles.logStatus}>
              {status === "playing"
                ? `${visibleCount}/${events.length || 12}`
                : status === "error"
                  ? "Erro"
                  : "Aguardando..."}
            </span>
          </div>

          <div className={styles.logList}>
            {status === "loading" && (
              <div className={styles.loadingLog}>Procurando adversario...</div>
            )}

            {status === "error" && (
              <div className={styles.loadingLog}>
                {errorMessage}
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" onClick={() => router.push("/game")}>
                    Voltar ao mercado
                  </Button>
                </div>
              </div>
            )}

            {status === "playing" &&
              shown.map((log) => (
                <article
                  className={`${styles.logItem} ${eventSideClass(log)}`}
                  key={log.turn}
                >
                  <span className={styles.logMinute}>{formatClock(log.turn)}</span>
                  <div className={styles.logBody}>
                    <strong>{eventTitle(log)}</strong>
                    <p>{log.description}</p>
                  </div>
                  <span className={styles.logScore}>
                    {scoreUpTo(events, events.indexOf(log))}
                  </span>
                </article>
              ))}
          </div>
        </section>
      </div>

      {isEndModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.resultModal}>
            <span className={styles.resultBadge}>{roundOutcome}</span>
            <h2>{matchTitle}</h2>
            <p>
              {resultLabel} &middot; Placar final: {finalScore}
            </p>

            <div className={styles.rewardStack}>
              {matchEnded ? (
                <div className={styles.trophyDelta}>
                  <TrophyFilled />
                  <strong>
                    {trophyPrefix}
                    {trophyDelta}
                  </strong>
                  <span>trofeus (total {resolution?.trophies ?? 0})</span>
                </div>
              ) : (
                <div className={styles.trophyDelta}>
                  <FlagFilled />
                  <strong>
                    {persisted?.victory ?? 0}/7 &middot; {persisted?.lose ?? 0}/4
                  </strong>
                  <span>vitorias / derrotas na temporada</span>
                </div>
              )}
            </div>

            <div
              className={`${styles.modalActions} ${
                matchEnded ? "" : styles.modalActionsSingle
              }`}
            >
              {matchEnded ? (
                <>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => router.push("/profile")}
                  >
                    Perfil
                  </Button>
                  <Button size="large" onClick={() => router.push("/")}>
                    Menu
                  </Button>
                </>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  onClick={() => router.push("/game")}
                >
                  Voltar ao mercado
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
