"use client";

import {
  DollarOutlined,
  FlagFilled,
  TeamOutlined,
  TrophyFilled,
  UserOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ProfileCorner from "@/components/ProfileCorner";
import {
  INITIAL_LIVES,
  readGameSession,
  resetGameSession,
  writeGameSession,
  type GameSession,
} from "@/lib/gameSession";
import {
  gameService,
  type MatchEvent,
  type MatchPositionPayload,
  type MatchResponse,
  type SnapshotAthlete,
  type SnapshotPositions,
} from "@/services/gameService";

import styles from "./BattlePage.module.css";

type MatchSide = "player" | "opponent" | "neutral";
type MatchOutcome = "goal" | "draw";

type MatchTurnLog = {
  turn: number;
  minute: string;
  side: MatchSide;
  title: string;
  description: string;
  score: string;
  outcome?: MatchOutcome;
};

type LineupSlot = {
  areaIndex: number;
  slotIndex: number;
  athlete: SnapshotAthlete | null;
};

const areaLabels = ["Defesa", "Centro", "Ataque"];

const fieldSlots: LineupSlot[] = [
  { areaIndex: 0, slotIndex: 0, athlete: null },
  { areaIndex: 0, slotIndex: 1, athlete: null },
  { areaIndex: 0, slotIndex: 2, athlete: null },
  { areaIndex: 1, slotIndex: 0, athlete: null },
  { areaIndex: 1, slotIndex: 1, athlete: null },
  { areaIndex: 1, slotIndex: 2, athlete: null },
  { areaIndex: 2, slotIndex: 0, athlete: null },
  { areaIndex: 2, slotIndex: 1, athlete: null },
  { areaIndex: 2, slotIndex: 2, athlete: null },
];

function buildPositionsFromSession(session: GameSession): MatchPositionPayload[] {
  return session.selectedAthleteIds.flatMap((athleteId, index) => {
    const numericId = Number(athleteId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return [];
    }

    return {
      athleteId: numericId,
      posX: index % 3,
      posY: Math.floor(index / 3),
    };
  });
}

function buildLineup(positions?: SnapshotPositions): LineupSlot[] {
  return fieldSlots.map((slot) => ({
    ...slot,
    athlete: positions?.[slot.areaIndex]?.[slot.slotIndex] ?? null,
  }));
}

function renderAthleteIcon(className: string) {
  return <img src="/athlete.svg" alt="" className={className} aria-hidden="true" />;
}

function getSideClass(side: MatchSide) {
  if (side === "player") return styles.logItemPlayer;
  if (side === "opponent") return styles.logItemOpponent;
  return styles.logItemNeutral;
}

function formatMinute(turn: number): string {
  const totalSeconds = turn * 18;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `0${minutes}:${seconds}`;
}

function sideForEvent(event: MatchEvent): MatchSide {
  if (event.kind === "tackle" && !event.success) {
    return event.possession === "player" ? "opponent" : "player";
  }
  return event.possession;
}

function titleForEvent(event: MatchEvent): string {
  if (event.goal) return "Gol!";
  if (event.kind === "turnover") return "Posse perdida";
  if (event.kind === "shot") return "Finalizacao";
  if (event.kind === "pass") return "Avanco";
  return event.success ? "Disputa vencida" : "Desarme";
}

function buildTurnLogs(events: MatchEvent[]): MatchTurnLog[] {
  let playerScore = 0;
  let opponentScore = 0;

  return events.map((event) => {
    if (event.goal) {
      if (event.possession === "player") {
        playerScore += 1;
      } else {
        opponentScore += 1;
      }
    }

    return {
      turn: event.turn,
      minute: formatMinute(event.turn),
      side: sideForEvent(event),
      title: titleForEvent(event),
      description: event.description,
      score: `${playerScore}x${opponentScore}`,
      outcome: event.goal ? "goal" : undefined,
    };
  });
}

function resultLabel(match: MatchResponse): string {
  if (match.winner === "player") return "Vitoria";
  if (match.winner === "opponent") return "Derrota";
  return "Empate";
}

function nextSessionFromMatch(
  session: GameSession,
  match: MatchResponse
): GameSession {
  return {
    ...session,
    coins: match.resolution.coins,
    currentBattle: match.persisted.round,
    victories: match.persisted.victory,
    losses: match.persisted.lose,
    lives: Math.max(0, INITIAL_LIVES - match.persisted.lose),
  };
}

function BattleField({
  title,
  subtitle,
  slots,
  mirrored = false,
}: {
  title: string;
  subtitle: string;
  slots: LineupSlot[];
  mirrored?: boolean;
}) {
  const visibleAreas = mirrored ? [...areaLabels].reverse() : areaLabels;

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
        {visibleAreas.map((areaLabel) => {
          const sourceAreaIndex = areaLabels.indexOf(areaLabel);
          const areaSlots = slots.filter(
            (slot) => slot.areaIndex === sourceAreaIndex
          );

          return (
            <div className={styles.fieldArea} key={areaLabel}>
              <span className={styles.areaLabel}>{areaLabel}</span>
              <div className={styles.fieldSlotGrid}>
                {areaSlots.map((slot) => (
                  <div
                    className={styles.fieldSlot}
                    key={`${title}-${slot.areaIndex}-${slot.slotIndex}`}
                  >
                    {slot.athlete ? (
                      <div className={styles.playerToken}>
                        {renderAthleteIcon(styles.playerIcon)}
                        <span>{slot.athlete.name}</span>
                      </div>
                    ) : (
                      <span className={styles.emptyToken} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function BattlePage() {
  const router = useRouter();
  const [gameSession, setGameSession] = useState<GameSession>(() =>
    readGameSession()
  );
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [visibleLogs, setVisibleLogs] = useState<MatchTurnLog[]>([]);
  const [isWaitingForRound, setIsWaitingForRound] = useState(true);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const playerLineup = useMemo(
    () => buildLineup(match?.lineups.player.positions),
    [match]
  );
  const opponentLineup = useMemo(
    () => buildLineup(match?.lineups.opponent.positions),
    [match]
  );

  const currentLog = visibleLogs[visibleLogs.length - 1];
  const currentScore =
    currentLog?.score ??
    (match ? `${match.score.player}x${match.score.opponent}` : "0x0");
  const currentTurn = currentLog?.turn ?? 0;
  const totalTurns = match?.totalTurns ?? 12;
  const finalOutcome = match?.winner === "draw" ? "Empate" : "Gol";
  const rewardPrefix = (match?.resolution.coinsEarned ?? 0) > 0 ? "+" : "";
  const trophyPrefix = (match?.resolution.trophiesDelta ?? 0) > 0 ? "+" : "";

  useEffect(() => {
    let cancelled = false;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    async function playRound() {
      const session = readGameSession();
      setGameSession(session);
      const positions = buildPositionsFromSession(session);

      if (positions.length === 0) {
        setErrorMessage("Escale ao menos 1 atleta antes de jogar.");
        setIsWaitingForRound(false);
        return;
      }

      try {
        const result = await gameService.playMatch(positions);
        if (cancelled) return;

        setMatch(result);
        setIsWaitingForRound(false);

        const logs = buildTurnLogs(result.events);
        if (logs.length === 0) {
          setVisibleLogs([]);
          setIsEndModalOpen(true);
          return;
        }

        logs.forEach((_, index) => {
          const turnTimer = setTimeout(() => {
            setVisibleLogs(logs.slice(0, index + 1));

            if (index === logs.length - 1) {
              setIsEndModalOpen(true);
            }
          }, (index + 1) * 850);

          timers.push(turnTimer);
        });
      } catch (error) {
        if (!cancelled) {
          const message =
            typeof error === "object" && error !== null && "response" in error
              ? (error as { response?: { data?: { message?: string } } }).response
                  ?.data?.message
              : null;
          setErrorMessage(message ?? "Nao foi possivel iniciar a batalha.");
          setIsWaitingForRound(false);
        }
      }
    }

    void playRound();

    return () => {
      cancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function handleContinueBattle() {
    if (!match) return;
    const nextSession = writeGameSession(nextSessionFromMatch(gameSession, match));
    setGameSession(nextSession);
    router.push("/game");
  }

  function handleFinishRun(destination: "/" | "/profile") {
    resetGameSession();
    router.push(destination);
  }

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
              {currentTurn}/{totalTurns}
            </strong>
          </div>
        </section>

        <section className={styles.arena} aria-label="Campo da partida">
          <BattleField
            title="Seu campo"
            subtitle={match?.lineups.player.name ?? "Time escalado agora"}
            slots={playerLineup}
          />

          <div className={styles.centerBridge} aria-hidden="true">
            <div className={styles.bridgeCircle}>
              <FlagFilled />
              <strong>{currentScore}</strong>
            </div>
          </div>

          <BattleField
            title="Campo rival"
            subtitle={match?.lineups.opponent.name ?? "Buscando adversario"}
            slots={opponentLineup}
            mirrored
          />
        </section>

        <section className={styles.logPanel} aria-labelledby="log-title">
          <div className={styles.logHeader}>
            <h2 id="log-title">Logs da rodada</h2>
            <span className={styles.logStatus}>
              {isWaitingForRound
                ? "Aguardando..."
                : `${visibleLogs.length}/${totalTurns}`}
            </span>
          </div>

          <div className={styles.logList}>
            {isWaitingForRound ? (
              <div className={styles.loadingLog}>Preparando partida...</div>
            ) : errorMessage ? (
              <div className={styles.loadingLog}>
                <span>{errorMessage}</span>
                <Button type="primary" onClick={() => router.push("/game")}>
                  Voltar ao Mercado
                </Button>
              </div>
            ) : visibleLogs.length === 0 ? (
              <div className={styles.loadingLog}>Rodada finalizada.</div>
            ) : (
              visibleLogs.map((log) => (
                <article
                  className={`${styles.logItem} ${getSideClass(log.side)}`}
                  key={log.turn}
                >
                  <span className={styles.logMinute}>{log.minute}</span>
                  <div className={styles.logBody}>
                    <strong>{log.title}</strong>
                    <p>{log.description}</p>
                  </div>
                  <span className={styles.logScore}>{log.score}</span>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {match && isEndModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.resultModal}>
            <span className={styles.resultBadge}>{finalOutcome}</span>
            <h2>
              {match.resolution.matchEnded ? "Fim da partida" : "Batalha finalizada"}
            </h2>
            <p>
              {resultLabel(match)} - Placar final: {match.score.player}x
              {match.score.opponent}
            </p>
            <div className={styles.rewardStack}>
              <div className={styles.coinDelta}>
                <DollarOutlined />
                <strong>
                  {rewardPrefix}
                  {match.resolution.coinsEarned}
                </strong>
                <span>moedas</span>
              </div>

              {match.resolution.matchEnded && (
                <div className={styles.trophyDelta}>
                  <TrophyFilled />
                  <strong>
                    {trophyPrefix}
                    {match.resolution.trophiesDelta}
                  </strong>
                  <span>trofeus</span>
                </div>
              )}
            </div>
            <div
              className={`${styles.modalActions} ${
                match.resolution.matchEnded ? "" : styles.modalActionsSingle
              }`}
            >
              {match.resolution.matchEnded ? (
                <>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => handleFinishRun("/profile")}
                  >
                    Perfil
                  </Button>
                  <Button size="large" onClick={() => handleFinishRun("/")}>
                    Menu
                  </Button>
                </>
              ) : (
                <Button type="primary" size="large" onClick={handleContinueBattle}>
                  Voltar ao Mercado
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
