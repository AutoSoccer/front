"use client";

import {
  ArrowLeftOutlined,
  DollarOutlined,
  EyeOutlined,
  HomeFilled,
  TeamOutlined,
  TrophyFilled,
  UserOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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

type FieldToken = {
  team: "player" | "opponent";
  athlete: SnapshotAthlete;
  x: number;
  y: number;
};

const displayRows = [0, 1, 2];
const displayColumns = [0, 1, 2, 3, 4, 5];

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
  if (!event.success && event.ball.team !== event.possession) {
    return event.ball.team;
  }
  return event.possession;
}

function titleForEvent(event: MatchEvent): string {
  if (event.goal) return "Gol!";
  if (event.kind === "turnover") return "Posse perdida";
  if (event.kind === "shot") return "Finalizacao";
  if (event.kind === "pass") {
    return event.success ? "Passe completo" : "Passe interceptado";
  }
  if (event.kind === "move") return "Avanco";
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

function buildFieldTokens(
  positions: SnapshotPositions,
  team: "player" | "opponent"
): FieldToken[] {
  return positions.flatMap((row, rowIndex) =>
    row.flatMap((athlete, columnIndex) => {
      if (!athlete) return [];
      return {
        team,
        athlete,
        x: columnIndex,
        y: team === "player" ? rowIndex : 5 - rowIndex,
      };
    })
  );
}

function SharedBattleField({
  match,
  visibleEventCount,
}: {
  match: MatchResponse | null;
  visibleEventCount: number;
}) {
  const state = useMemo(() => {
    if (!match) {
      return { tokens: [] as FieldToken[], ball: null };
    }

    const tokens = [
      ...buildFieldTokens(match.lineups.player.positions, "player"),
      ...buildFieldTokens(match.lineups.opponent.positions, "opponent"),
    ];
    let ball = match.initialBall;

    for (const event of match.events.slice(0, visibleEventCount)) {
      for (const movement of event.movements) {
        const token = tokens.find(
          (entry) =>
            entry.team === movement.team &&
            entry.athlete.id === movement.athleteId
        );
        if (token) {
          token.x = movement.to.x;
          token.y = movement.to.y;
        }
      }
      ball = event.ball;
    }

    return { tokens, ball };
  }, [match, visibleEventCount]);

  return (
    <section
      className={styles.sharedField}
      aria-label="Campo compartilhado horizontal 6 por 3"
    >
      <div
        className={`${styles.fieldTeamHeader} ${styles.fieldTeamHeaderMine}`}
      >
        <UserOutlined />
        <strong>{match?.lineups.player.name ?? "Seu time"}</strong>
      </div>
      <div
        className={`${styles.fieldTeamHeader} ${styles.fieldTeamHeaderOpponent}`}
      >
        <TeamOutlined />
        <strong>{match?.lineups.opponent.name ?? "Adversario"}</strong>
      </div>

      <div className={styles.goalLine} aria-hidden="true" />
      <div className={styles.sharedFieldGrid}>
        {displayRows.flatMap((x) =>
          displayColumns.map((y) => {
            const tokens = state.tokens.filter(
              (entry) => entry.x === x && entry.y === y
            );
            const hasBall =
              state.ball?.position.x === x && state.ball.position.y === y;

            return (
              <div
                className={`${styles.sharedFieldCell} ${
                  y === 2 ? styles.centerLineCell : ""
                }`}
                key={`${x}-${y}`}
              >
                <div className={styles.cellTokens}>
                  {tokens.map((token) => (
                    <div
                      className={`${styles.fieldPlayerToken} ${
                        token.team === "player"
                          ? styles.fieldPlayerTokenMine
                          : styles.fieldPlayerTokenOpponent
                      }`}
                      key={`${token.team}-${token.athlete.id}`}
                      title={`${token.athlete.name} - ATK ${token.athlete.attack} / VEL ${token.athlete.velocity} / DEF ${token.athlete.defense}`}
                    >
                      {renderAthleteIcon(styles.fieldPlayerIcon)}
                      <span>{token.athlete.name}</span>
                    </div>
                  ))}
                </div>
                {hasBall && (
                  <span
                    className={styles.ball}
                    title={`Bola com ${state.ball?.athleteName ?? ""}`}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default function BattlePage() {
  const router = useRouter();
  const roundRequestRef = useRef<Promise<MatchResponse> | null>(null);
  const [gameSession, setGameSession] = useState<GameSession>(() =>
    readGameSession()
  );
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [visibleLogs, setVisibleLogs] = useState<MatchTurnLog[]>([]);
  const [isWaitingForRound, setIsWaitingForRound] = useState(true);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isBattleFinished, setIsBattleFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        if (!roundRequestRef.current) {
          roundRequestRef.current = gameService.playMatch(positions);
        }

        const result = await roundRequestRef.current;
        if (cancelled) return;

        setMatch(result);
        setIsWaitingForRound(false);

        const logs = buildTurnLogs(result.events);
        if (logs.length === 0) {
          setVisibleLogs([]);
          setIsBattleFinished(true);
          setIsEndModalOpen(true);
          return;
        }

        logs.forEach((_, index) => {
          const turnTimer = setTimeout(() => {
            setVisibleLogs(logs.slice(0, index + 1));

            if (index === logs.length - 1) {
              setIsBattleFinished(true);
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

  function handleReturnToMarket() {
    if (!match) return;

    const nextSession = match.resolution.matchEnded
      ? resetGameSession()
      : writeGameSession(nextSessionFromMatch(gameSession, match));
    setGameSession(nextSession);
    router.push("/game");
  }

  function handleGoToMenu() {
    resetGameSession();
    router.push("/");
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

        {match && isBattleFinished && !isEndModalOpen && (
          <section
            className={styles.resultSummary}
            aria-label="Resultado final da batalha"
          >
            <div className={styles.resultSummaryMain}>
              <span className={styles.resultSummaryLabel}>
                {resultLabel(match)}
              </span>
              <strong>
                Placar final {match.score.player}x{match.score.opponent}
              </strong>
            </div>
            <div className={styles.resultSummaryRewards}>
              <span>
                <DollarOutlined />
                {rewardPrefix}
                {match.resolution.coinsEarned} moedas
              </span>
              {match.resolution.matchEnded && (
                <span>
                  <TrophyFilled />
                  {trophyPrefix}
                  {match.resolution.trophiesDelta} troféus
                </span>
              )}
            </div>
            <Button
              type="primary"
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={handleReturnToMarket}
            >
              Voltar ao Mercado
            </Button>
          </section>
        )}

        <section className={styles.arena} aria-label="Campo da partida">
          <SharedBattleField
            match={match}
            visibleEventCount={visibleLogs.length}
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
              {match.resolution.matchEnded
                ? "Campanha finalizada"
                : "Batalha finalizada"}
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
            <div className={styles.modalActions}>
              {match.resolution.matchEnded ? (
                <>
                  <Button
                    size="large"
                    icon={<EyeOutlined />}
                    onClick={() => setIsEndModalOpen(false)}
                  >
                    Ver resultados
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<HomeFilled />}
                    onClick={handleGoToMenu}
                  >
                    Menu
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="large"
                    icon={<EyeOutlined />}
                    onClick={() => setIsEndModalOpen(false)}
                  >
                    Ver resultados
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleReturnToMarket}
                  >
                    Voltar ao Mercado
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
