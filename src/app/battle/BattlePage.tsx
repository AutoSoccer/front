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
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import ProfileCorner from "@/components/ProfileCorner";
import { getErrorMessage } from "@/lib/errors";
import {
  INITIAL_LIVES,
  readGameSession,
  resetGameSession,
  writeGameSession,
  type GameSession,
} from "@/lib/gameSession";
import { useBattleStream } from "@/hooks/useBattleStream";
import {
  gameService,
  type MatchEvent,
  type MatchPositionPayload,
  type MatchResponse,
  type PlayMatchResponse,
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

function buildPositionsFromSession(
  session: GameSession,
): MatchPositionPayload[] {
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
  return (
    <img src="/athlete.svg" alt="" className={className} aria-hidden="true" />
  );
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

type EventsTranslator = ReturnType<typeof useTranslations<"battle.events">>;

function titleForEvent(event: MatchEvent, tEvents: EventsTranslator): string {
  if (event.goal) return tEvents("goal");
  if (event.kind === "turnover") return tEvents("turnover");
  if (event.kind === "shot") return tEvents("shot");
  if (event.kind === "pass") {
    return event.success ? tEvents("passOk") : tEvents("passFail");
  }
  if (event.kind === "move") return tEvents("advance");
  return event.success ? tEvents("won") : tEvents("tackle");
}

function buildTurnLogs(
  events: MatchEvent[],
  tEvents: EventsTranslator,
): MatchTurnLog[] {
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
      title: titleForEvent(event, tEvents),
      description: event.description,
      score: `${playerScore}x${opponentScore}`,
      outcome: event.goal ? "goal" : undefined,
    };
  });
}

function nextSessionFromMatch(
  session: GameSession,
  match: MatchResponse,
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
  team: "player" | "opponent",
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
    }),
  );
}

function SharedBattleField({
  match,
  visibleEventCount,
}: {
  match: MatchResponse | null;
  visibleEventCount: number;
}) {
  const t = useTranslations("battle.field");
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
            entry.athlete.id === movement.athleteId,
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
    <section className={styles.sharedField} aria-label={t("aria")}>
      <div
        className={`${styles.fieldTeamHeader} ${styles.fieldTeamHeaderMine}`}
      >
        <UserOutlined />
        <strong>{match?.lineups.player.name ?? t("myTeam")}</strong>
      </div>
      <div
        className={`${styles.fieldTeamHeader} ${styles.fieldTeamHeaderOpponent}`}
      >
        <TeamOutlined />
        <strong>{match?.lineups.opponent.name ?? t("opponent")}</strong>
      </div>

      <div className={styles.goalLine} aria-hidden="true" />
      <div className={styles.sharedFieldGrid}>
        {displayRows.flatMap((x) =>
          displayColumns.map((y) => {
            const tokens = state.tokens.filter(
              (entry) => entry.x === x && entry.y === y,
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
                      title={t("tokenTitle", {
                        name: token.athlete.name,
                        attack: token.athlete.attack,
                        velocity: token.athlete.velocity,
                        defense: token.athlete.defense,
                      })}
                    >
                      {renderAthleteIcon(styles.fieldPlayerIcon)}
                      <span>{token.athlete.name}</span>
                    </div>
                  ))}
                </div>
                {hasBall && (
                  <span
                    className={styles.ball}
                    title={t("ballTitle", {
                      name: state.ball?.athleteName ?? "",
                    })}
                  />
                )}
              </div>
            );
          }),
        )}
      </div>
    </section>
  );
}

export default function BattlePage() {
  const router = useRouter();
  const t = useTranslations("battle");
  const tEvents = useTranslations("battle.events");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const roundRequestRef = useRef<Promise<PlayMatchResponse> | null>(null);
  const [gameSession, setGameSession] = useState<GameSession>(() =>
    readGameSession(),
  );
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [visibleLogs, setVisibleLogs] = useState<MatchTurnLog[]>([]);
  const [isWaitingForRound, setIsWaitingForRound] = useState(true);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isBattleFinished, setIsBattleFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    state: wsState,
    connect: wsConnect,
    disconnect: wsDisconnect,
  } = useBattleStream();

  const resultLabel = (matchValue: MatchResponse): string => {
    if (matchValue.winner === "player") return t("result.victory");
    if (matchValue.winner === "opponent") return t("result.defeat");
    return t("result.draw");
  };

  const currentLog = visibleLogs[visibleLogs.length - 1];
  const currentScore =
    currentLog?.score ??
    (match ? `${match.score.player}x${match.score.opponent}` : "0x0");
  const currentTurn = currentLog?.turn ?? 0;
  const totalTurns = match?.totalTurns ?? 12;
  const finalOutcome =
    match?.winner === "draw" ? t("outcome.draw") : t("outcome.goal");
  const rewardPrefix = (match?.resolution.coinsEarned ?? 0) > 0 ? "+" : "";
  const trophyPrefix = (match?.resolution.trophiesDelta ?? 0) > 0 ? "+" : "";

  function startEventAnimation(result: MatchResponse) {
    const logs = buildTurnLogs(result.events, tEvents);
    if (logs.length === 0) {
      setVisibleLogs([]);
      setIsBattleFinished(true);
      setIsEndModalOpen(true);
      return [];
    }

    const timers: Array<ReturnType<typeof setTimeout>> = [];
    logs.forEach((_, index) => {
      const timer = setTimeout(
        () => {
          setVisibleLogs(logs.slice(0, index + 1));
          if (index === logs.length - 1) {
            setIsBattleFinished(true);
            setIsEndModalOpen(true);
          }
        },
        (index + 1) * 850,
      );
      timers.push(timer);
    });
    return timers;
  }

  useEffect(() => {
    let cancelled = false;
    let timers: Array<ReturnType<typeof setTimeout>> = [];

    async function playRound() {
      const session = readGameSession();
      setGameSession(session);
      const positions = buildPositionsFromSession(session);

      if (positions.length === 0) {
        setErrorMessage(t("errors.noAthletes"));
        setIsWaitingForRound(false);
        return;
      }

      try {
        if (!roundRequestRef.current) {
          roundRequestRef.current = gameService.playMatch(positions);
        }

        const response = await roundRequestRef.current;
        if (cancelled) return;

        setMatch(response);
        setIsWaitingForRound(false);

        const token = localStorage.getItem("token");
        if (response.matchId && token) {
          wsConnect(response.matchId, token, response);
        } else {
          timers = startEventAnimation(response);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            getErrorMessage(error, tErrors) || t("errors.battleStartFailed"),
          );
          setIsWaitingForRound(false);
        }
      }
    }

    void playRound();

    return () => {
      cancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (wsState.status === "streaming") {
      const logs = buildTurnLogs(wsState.events, tEvents);
      setVisibleLogs(logs);
    }

    if (wsState.status === "finished") {
      const logs = buildTurnLogs(wsState.result.events, tEvents);
      setVisibleLogs(logs);
      setMatch(wsState.result);
      setIsBattleFinished(true);
      setIsEndModalOpen(true);
    }

    if (wsState.status === "error" && wsState.fallbackResult) {
      startEventAnimation(wsState.fallbackResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsState]);

  useEffect(() => () => wsDisconnect(), [wsDisconnect]);

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
      <span className={styles.brandFloating} aria-label={tCommon("appName")}>
        <img src="/logo.png" alt={tCommon("appName")} />
      </span>
      <ProfileCorner />

      <div className={styles.battleShell}>
        <header
          className={styles.headerCombined}
          aria-label={t("header.summaryAria")}
        >
          <div className={styles.headerSection}>
            <h1 className={styles.title}>{t("title")}</h1>
            {wsState.status === "connecting" && (
              <span className={styles.liveBadge}>{t("live.connecting")}</span>
            )}
            {wsState.status === "streaming" && (
              <span className={styles.liveBadge} aria-live="polite">
                {t("live.streaming", {
                  turn: wsState.currentTurn,
                  total: match?.totalTurns ?? 12,
                })}
              </span>
            )}
          </div>
          <div className={styles.headerDivider} aria-hidden="true" />
          <div className={styles.headerSection}>
            <span className={styles.hudLabel}>{t("header.score")}</span>
            <strong className={styles.scoreValue}>{currentScore}</strong>
          </div>
          <div className={styles.headerDivider} aria-hidden="true" />
          <div className={styles.headerSection}>
            <span className={styles.hudLabel}>{t("header.turn")}</span>
            <strong className={styles.hudValue}>
              {currentTurn}/{totalTurns}
            </strong>
          </div>
        </header>

        {match && isBattleFinished && !isEndModalOpen && (
          <section
            className={styles.resultSummary}
            aria-label={t("summary.ariaLabel")}
          >
            <div className={styles.resultSummaryMain}>
              <span className={styles.resultSummaryLabel}>
                {resultLabel(match)}
              </span>
              <strong>
                {t("summary.finalScore", {
                  player: match.score.player,
                  opponent: match.score.opponent,
                })}
              </strong>
            </div>
            <div className={styles.resultSummaryRewards}>
              <span>
                <DollarOutlined />
                {t("summary.coins", {
                  prefix: rewardPrefix,
                  count: match.resolution.coinsEarned,
                })}
              </span>
              {match.resolution.matchEnded && (
                <span>
                  <TrophyFilled />
                  {t("summary.trophies", {
                    prefix: trophyPrefix,
                    count: match.resolution.trophiesDelta,
                  })}
                </span>
              )}
            </div>
            <Button
              type="primary"
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={handleReturnToMarket}
            >
              {t("summary.backToMarket")}
            </Button>
          </section>
        )}

        <div className={styles.battleGrid}>
          <section className={styles.arena} aria-label={t("field.aria")}>
            <SharedBattleField
              match={match}
              visibleEventCount={visibleLogs.length}
            />
          </section>

          <section className={styles.logPanel} aria-labelledby="log-title">
            <div className={styles.logHeader}>
              <h2 id="log-title">{t("log.title")}</h2>
              <span className={styles.logStatus}>
                {isWaitingForRound
                  ? t("log.waiting")
                  : `${visibleLogs.length}/${totalTurns}`}
              </span>
            </div>

            <ul className={styles.logsList}>
              {isWaitingForRound ? (
                <li className={styles.loadingLog}>{t("log.preparing")}</li>
              ) : errorMessage ? (
                <li className={styles.loadingLog}>
                  <span>{errorMessage}</span>
                  <Button type="primary" onClick={() => router.push("/game")}>
                    {t("summary.backToMarket")}
                  </Button>
                </li>
              ) : visibleLogs.length === 0 ? (
                <li className={styles.loadingLog}>{t("log.finished")}</li>
              ) : (
                visibleLogs.map((log) => (
                  <li
                    className={`${styles.logItemVertical} ${getSideClass(log.side)}`}
                    key={log.turn}
                  >
                    <div className={styles.logItemHeader}>
                      <span className={styles.logMinute}>{log.minute}</span>
                      <span className={styles.logScore}>{log.score}</span>
                    </div>
                    <div className={styles.logBody}>
                      <strong>{log.title}</strong>
                      <p>{log.description}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>

      {match && isEndModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.resultModal}>
            <span className={styles.resultBadge}>{finalOutcome}</span>
            <h2>
              {match.resolution.matchEnded
                ? t("modal.campaignEnded")
                : t("modal.battleEnded")}
            </h2>
            <p>
              {t("modal.result", {
                result: resultLabel(match),
                player: match.score.player,
                opponent: match.score.opponent,
              })}
            </p>
            <div className={styles.rewardStack}>
              <div className={styles.coinDelta}>
                <DollarOutlined />
                <strong>
                  {rewardPrefix}
                  {match.resolution.coinsEarned}
                </strong>
                <span>{t("modal.coins")}</span>
              </div>

              {match.resolution.matchEnded && (
                <div className={styles.trophyDelta}>
                  <TrophyFilled />
                  <strong>
                    {trophyPrefix}
                    {match.resolution.trophiesDelta}
                  </strong>
                  <span>{t("modal.trophies")}</span>
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
                    {t("modal.viewResults")}
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<HomeFilled />}
                    onClick={handleGoToMenu}
                  >
                    {t("modal.menu")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="large"
                    icon={<EyeOutlined />}
                    onClick={() => setIsEndModalOpen(false)}
                  >
                    {t("modal.viewResults")}
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleReturnToMarket}
                  >
                    {t("modal.backToMarket")}
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
