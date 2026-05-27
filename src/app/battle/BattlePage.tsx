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
  readGameSession,
  resetGameSession,
  resolveBattle,
  writeGameSession,
  type BattleResult,
  type GameSession,
} from "@/lib/gameSession";

import { athletePool, type AthleteMarketItem } from "../game/athletes";
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
  result?: BattleResult;
};

type LineupSlot = {
  areaIndex: number;
  slotIndex: number;
  athlete: AthleteMarketItem | null;
};

const areaLabels = ["Defesa", "Centro", "Ataque"];

const sampleMatchLogs: MatchTurnLog[] = [
  {
    turn: 1,
    minute: "00:18",
    side: "player",
    title: "Saida rapida",
    description: "Seu time troca passes pela esquerda.",
    score: "0x0",
  },
  {
    turn: 2,
    minute: "00:36",
    side: "opponent",
    title: "Resposta rival",
    description: "O adversario pressiona o meio-campo.",
    score: "0x0",
  },
  {
    turn: 3,
    minute: "00:54",
    side: "player",
    title: "Drible curto",
    description: "A jogada passa pelo centro e abre espaco.",
    score: "0x0",
  },
  {
    turn: 4,
    minute: "01:12",
    side: "neutral",
    title: "Bola disputada",
    description: "A defesa corta antes da finalizacao.",
    score: "0x0",
  },
  {
    turn: 5,
    minute: "01:30",
    side: "opponent",
    title: "Contra-ataque",
    description: "O rival acelera e obriga uma cobertura.",
    score: "0x0",
  },
  {
    turn: 6,
    minute: "01:48",
    side: "player",
    title: "Passe vertical",
    description: "O ataque recebe perto da area.",
    score: "0x0",
  },
  {
    turn: 7,
    minute: "02:06",
    side: "player",
    title: "Chute bloqueado",
    description: "A bola desvia na zaga e sai pela linha de fundo.",
    score: "0x0",
  },
  {
    turn: 8,
    minute: "02:24",
    side: "neutral",
    title: "Recomposicao",
    description: "Os dois times reorganizam as linhas.",
    score: "0x0",
  },
  {
    turn: 9,
    minute: "02:42",
    side: "opponent",
    title: "Pressao final",
    description: "O campo direito tenta chegar pelo corredor central.",
    score: "0x0",
  },
  {
    turn: 10,
    minute: "03:00",
    side: "player",
    title: "Roubo de bola",
    description: "Sua defesa recupera e aciona o ataque.",
    score: "0x0",
  },
  {
    turn: 11,
    minute: "03:18",
    side: "player",
    title: "Ultimo passe",
    description: "A bola encontra o atacante livre no centro.",
    score: "0x0",
  },
  {
    turn: 12,
    minute: "03:36",
    side: "player",
    title: "Gol!",
    description: "Finalizacao forte no canto direito.",
    score: "1x0",
    outcome: "goal",
    result: "win",
  },
];

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

function getAthletes(): AthleteMarketItem[] {
  return athletePool.filter((item): item is AthleteMarketItem => item !== null);
}

function buildLineup(athletes: AthleteMarketItem[], offset = 0): LineupSlot[] {
  const placements = [
    { areaIndex: 0, slotIndex: 1 },
    { areaIndex: 1, slotIndex: 0 },
    { areaIndex: 1, slotIndex: 2 },
    { areaIndex: 2, slotIndex: 0 },
    { areaIndex: 2, slotIndex: 2 },
  ];

  return fieldSlots.map((slot) => {
    const placementIndex = placements.findIndex(
      (placement) =>
        placement.areaIndex === slot.areaIndex &&
        placement.slotIndex === slot.slotIndex
    );

    if (placementIndex < 0) {
      return slot;
    }

    return {
      ...slot,
      athlete: athletes[(placementIndex + offset) % athletes.length] ?? null,
    };
  });
}

function renderAthleteIcon(icon: string, className: string) {
  if (icon.startsWith("/")) {
    return <img src={icon} alt="" className={className} aria-hidden="true" />;
  }

  return <span className={className}>{icon}</span>;
}

function getSideClass(side: MatchSide) {
  if (side === "player") return styles.logItemPlayer;
  if (side === "opponent") return styles.logItemOpponent;
  return styles.logItemNeutral;
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
                        {renderAthleteIcon(slot.athlete.icon, styles.playerIcon)}
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
  const [gameSession] = useState<GameSession>(() => readGameSession());
  const [visibleLogs, setVisibleLogs] = useState<MatchTurnLog[]>([]);
  const [isWaitingForRound, setIsWaitingForRound] = useState(true);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);

  const athletes = useMemo(() => getAthletes(), []);
  const playerLineup = useMemo(() => buildLineup(athletes), [athletes]);
  const opponentLineup = useMemo(() => buildLineup(athletes, 3), [athletes]);

  const currentLog = visibleLogs[visibleLogs.length - 1];
  const finalLog = sampleMatchLogs[sampleMatchLogs.length - 1];
  const currentScore = currentLog?.score ?? "0x0";
  const currentTurn = currentLog?.turn ?? 0;
  const finalOutcome = finalLog.outcome === "draw" ? "Empate 0x0" : "Gol";
  const battleResult = finalLog.result ?? "draw";
  const battleResolution = useMemo(
    () => resolveBattle(gameSession, battleResult),
    [battleResult, gameSession]
  );
  const rewardPrefix = battleResolution.coinReward > 0 ? "+" : "";
  const trophyPrefix = battleResolution.trophyDelta > 0 ? "+" : "";

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    const responseTimer = setTimeout(() => {
      setIsWaitingForRound(false);

      sampleMatchLogs.forEach((_, index) => {
        const turnTimer = setTimeout(() => {
          setVisibleLogs(sampleMatchLogs.slice(0, index + 1));

          if (index === sampleMatchLogs.length - 1) {
            setIsEndModalOpen(true);
          }
        }, (index + 1) * 850);

        timers.push(turnTimer);
      });
    }, 650);

    timers.push(responseTimer);

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function handleContinueBattle() {
    writeGameSession(battleResolution.nextSession);
    router.push("/game");
  }

  function handleFinishRun(destination: "/" | "/profile") {
    writeGameSession(battleResolution.nextSession);
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
            <strong className={styles.hudValue}>{currentTurn}/12</strong>
          </div>
        </section>

        <section className={styles.arena} aria-label="Campo da partida">
          <BattleField
            title="Seu campo"
            subtitle="Time escalado agora"
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
            subtitle="Time montado antes"
            slots={opponentLineup}
            mirrored
          />
        </section>

        <section className={styles.logPanel} aria-labelledby="log-title">
          <div className={styles.logHeader}>
            <h2 id="log-title">Logs da rodada</h2>
            <span className={styles.logStatus}>
              {isWaitingForRound ? "Aguardando..." : `${visibleLogs.length}/12`}
            </span>
          </div>

          <div className={styles.logList}>
            {isWaitingForRound ? (
              <div className={styles.loadingLog}>Preparando partida...</div>
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

      {isEndModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.resultModal}>
            <span className={styles.resultBadge}>{finalOutcome}</span>
            <h2>
              {battleResolution.isRunOver ? "Fim da partida" : "Batalha finalizada"}
            </h2>
            <p>
              {battleResolution.resultLabel} · Placar final: {finalLog.score}
            </p>
            <div className={styles.rewardStack}>
              <div className={styles.coinDelta}>
                <DollarOutlined />
                <strong>
                  {rewardPrefix}
                  {battleResolution.coinReward}
                </strong>
                <span>moedas</span>
              </div>

              {battleResolution.isRunOver && (
                <div className={styles.trophyDelta}>
                  <TrophyFilled />
                  <strong>
                    {trophyPrefix}
                    {battleResolution.trophyDelta}
                  </strong>
                  <span>troféus</span>
                </div>
              )}
            </div>
            <div
              className={`${styles.modalActions} ${
                battleResolution.isRunOver ? "" : styles.modalActionsSingle
              }`}
            >
              {battleResolution.isRunOver ? (
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
