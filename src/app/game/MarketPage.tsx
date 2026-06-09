"use client";

import {
  DollarOutlined,
  HeartFilled,
  PlayCircleFilled,
  ReloadOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import { Button } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import AthleteMarketItemCard from "@/components/AthleteMarketItem";
import ProfileCorner from "@/components/ProfileCorner";
import { useAuth } from "@/hooks/useAuth";
import {
  INITIAL_LIVES,
  readGameSession,
  WINS_TO_FINISH,
  writeGameSession,
  type GameSession,
} from "@/lib/gameSession";
import { gameService } from "@/services/gameService";

import {
  mapApiAthleteToMarketItem,
  type AthleteMarketItem,
} from "./athletes";
import styles from "./MarketPage.module.css";

type BoardSlot = {
  id: string;
  areaIndex: number;
  slotIndex: number;
  item: AthleteMarketItem | null;
};

const areaLabels = ["Defesa", "Centro", "Ataque"];
const BOARD_LIMIT = 6;

function createEmptyBoardSlots(): BoardSlot[] {
  const slots: BoardSlot[] = [];
  for (let areaIndex = 0; areaIndex < 3; areaIndex += 1) {
    for (let slotIndex = 0; slotIndex < 3; slotIndex += 1) {
      slots.push({
        id: `slot-${areaIndex}-${slotIndex}`,
        areaIndex,
        slotIndex,
        item: null,
      });
    }
  }
  return slots;
}

function findAthleteById(
  id: string | null | undefined,
  athletes: AthleteMarketItem[]
): AthleteMarketItem | null {
  if (!id) return null;
  return athletes.find((item) => item.id === id) ?? null;
}

function preferredAreaForAthlete(athlete: AthleteMarketItem): number {
  if (athlete.type === "defender") return 0;
  if (athlete.type === "midfielder") return 1;
  return 2;
}

function placeAthleteInFirstOpenSlot(
  slots: BoardSlot[],
  athlete: AthleteMarketItem
): void {
  const preferredArea = preferredAreaForAthlete(athlete);
  const areaOrder = [preferredArea, 1, 0, 2].filter(
    (areaIndex, index, list) => list.indexOf(areaIndex) === index
  );

  for (const areaIndex of areaOrder) {
    const slot = slots.find(
      (entry) => entry.areaIndex === areaIndex && entry.item === null
    );
    if (slot) {
      slot.item = athlete;
      return;
    }
  }
}

function createBoardSlots(
  selectedAthleteIds: Array<string | null> = [],
  ownedAthletes: AthleteMarketItem[] = []
): BoardSlot[] {
  const slots = createEmptyBoardSlots();
  const placed = new Set<string>();

  selectedAthleteIds.forEach((athleteId, index) => {
    const athlete = findAthleteById(athleteId, ownedAthletes);
    if (!athlete || placed.has(athlete.id) || !slots[index]) {
      return;
    }
    slots[index].item = athlete;
    placed.add(athlete.id);
  });

  for (const athlete of ownedAthletes) {
    if (placed.has(athlete.id)) {
      continue;
    }
    placeAthleteInFirstOpenSlot(slots, athlete);
    placed.add(athlete.id);
  }

  return slots;
}

function renderAthleteIcon(icon: string, className: string) {
  if (icon.startsWith("/")) {
    return <img src={icon} alt="" className={className} aria-hidden="true" />;
  }
  return <span className={className}>{icon}</span>;
}

function getSelectedAthleteIds(slots: BoardSlot[]): Array<string | null> {
  return slots.map((slot) => slot.item?.id ?? null);
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const maybeResponse = error as {
      response?: { data?: { message?: string } };
    };
    return maybeResponse.response?.data?.message ?? "Nao foi possivel concluir a acao.";
  }

  return "Nao foi possivel concluir a acao.";
}

export default function MarketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [gameSession, setGameSession] = useState<GameSession>(() =>
    readGameSession()
  );
  const [marketItems, setMarketItems] = useState<Array<AthleteMarketItem | null>>(
    []
  );
  const [boardSlots, setBoardSlots] = useState<BoardSlot[]>(() =>
    createEmptyBoardSlots()
  );
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isSellZoneActive, setIsSellZoneActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionPending, setIsActionPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshCost, setRefreshCost] = useState(1);

  const coins = gameSession.coins;
  const currentBattle = gameSession.currentBattle;
  const victories = gameSession.victories;
  const lives = gameSession.lives;

  const availableCount = useMemo(
    () => marketItems.filter((item) => item !== null).length,
    [marketItems]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadGameData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [currentUser, market, team] = await Promise.all([
          gameService.getCurrentUser(),
          gameService.getMarket(),
          gameService.getTeam(),
        ]);

        if (cancelled) {
          return;
        }

        const owned = team?.athletes.map(mapApiAthleteToMarketItem) ?? [];
        const storedSession = readGameSession();
        const nextSession: GameSession = {
          ...storedSession,
          coins: currentUser.coins ?? storedSession.coins,
          currentBattle: team?.round ?? storedSession.currentBattle,
          victories: team?.victory ?? storedSession.victories,
          losses: team?.lose ?? storedSession.losses,
          lives:
            typeof team?.lose === "number"
              ? Math.max(0, INITIAL_LIVES - team.lose)
              : storedSession.lives,
        };
        const slots = createBoardSlots(nextSession.selectedAthleteIds, owned);
        const selectedAthleteIds = getSelectedAthleteIds(slots);
        const syncedSession = writeGameSession({
          ...nextSession,
          selectedAthleteIds,
        });

        setBoardSlots(slots);
        setGameSession(syncedSession);
        setMarketItems(market.athletes.map(mapApiAthleteToMarketItem));
        setRefreshCost(market.refresh_cost);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadGameData();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  function commitGameSession(
    updater: (currentSession: GameSession) => GameSession
  ) {
    setGameSession((currentSession) => {
      const nextSession = writeGameSession(updater(currentSession));
      return nextSession;
    });
  }

  async function handleRotateMarket() {
    if (isActionPending) return;
    if (coins < refreshCost) {
      setErrorMessage("Saldo insuficiente para atualizar o mercado.");
      return;
    }

    setIsActionPending(true);
    setErrorMessage(null);
    try {
      const market = await gameService.refreshMarket();
      setMarketItems(market.athletes.map(mapApiAthleteToMarketItem));
      setRefreshCost(market.refresh_cost);
      commitGameSession((currentSession) => ({
        ...currentSession,
        coins: market.coins,
      }));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsActionPending(false);
    }
  }

  function handleDragStart(
    event: React.DragEvent<HTMLButtonElement>,
    itemId: string
  ) {
    event.dataTransfer.setData("text/plain", itemId);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragStartFromSlot(
    event: React.DragEvent<HTMLDivElement>,
    itemId: string,
    sourceSlotId: string
  ) {
    event.dataTransfer.setData("itemId", itemId);
    event.dataTransfer.setData("sourceSlotId", sourceSlotId);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragEndFromSlot() {
    setDragOverId(null);
    setIsSellZoneActive(false);
  }

  async function sellAthleteFromBoard(slotId: string) {
    if (isActionPending) {
      return;
    }

    const soldSlot = boardSlots.find((slot) => slot.id === slotId);
    if (!soldSlot?.item) {
      return;
    }

    setIsActionPending(true);
    setErrorMessage(null);

    try {
      const sale = await gameService.sellAthlete(soldSlot.item.athleteId);
      const nextSlots = boardSlots.map((slot) =>
        slot.id === slotId ? { ...slot, item: null } : slot
      );

      setBoardSlots(nextSlots);
      commitGameSession((currentSession) => ({
        ...currentSession,
        coins: sale.user.coins,
        selectedAthleteIds: getSelectedAthleteIds(nextSlots),
      }));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsActionPending(false);
    }
  }

  function handleSellDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOverId(null);
    setIsSellZoneActive(false);

    const sourceSlotId = event.dataTransfer.getData("sourceSlotId");
    if (!sourceSlotId) return;

    const sourceSlot = boardSlots.find((slot) => slot.id === sourceSlotId);
    if (!sourceSlot?.item) return;

    void sellAthleteFromBoard(sourceSlotId);
  }

  async function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
    slotId: string
  ) {
    event.preventDefault();
    setDragOverId(null);

    if (isActionPending) {
      return;
    }

    const sourceSlotId = event.dataTransfer.getData("sourceSlotId");
    const draggedId =
      event.dataTransfer.getData("itemId") ||
      event.dataTransfer.getData("text/plain");

    if (!draggedId) return;

    const targetSlot = boardSlots.find((s) => s.id === slotId);
    if (!targetSlot || targetSlot.item !== null) return;

    if (sourceSlotId) {
      const sourceSlot = boardSlots.find((s) => s.id === sourceSlotId);
      if (!sourceSlot || !sourceSlot.item) return;

      const athletesInTargetArea = boardSlots.filter(
        (s) => s.areaIndex === targetSlot.areaIndex && s.item !== null
      ).length;
      if (athletesInTargetArea >= 3) return;

      const nextSlots = boardSlots.map((slot) => {
        if (slot.id === sourceSlotId) return { ...slot, item: null };
        if (slot.id === slotId) return { ...slot, item: sourceSlot.item };
        return slot;
      });

      setBoardSlots(nextSlots);
      commitGameSession((currentSession) => ({
        ...currentSession,
        selectedAthleteIds: getSelectedAthleteIds(nextSlots),
      }));
      return;
    }

    const draggedItem = marketItems.find((item) => item?.id === draggedId);
    if (!draggedItem) return;

    const alreadyOnBoard = boardSlots.some(
      (slot) => slot.item?.id === draggedId
    );
    if (alreadyOnBoard) return;

    const athletesOnBoard = boardSlots.filter((s) => s.item !== null).length;
    if (athletesOnBoard >= BOARD_LIMIT) return;

    const athletesInArea = boardSlots.filter(
      (s) => s.areaIndex === targetSlot.areaIndex && s.item !== null
    ).length;
    if (athletesInArea >= 3) return;

    if (coins < draggedItem.cost) {
      setErrorMessage("Saldo insuficiente para comprar este atleta.");
      return;
    }

    setIsActionPending(true);
    setErrorMessage(null);
    try {
      const purchase = await gameService.buyAthlete(draggedItem.athleteId);
      const nextSlots = boardSlots.map((slot) =>
        slot.id === slotId ? { ...slot, item: draggedItem } : slot
      );

      setBoardSlots(nextSlots);
      setMarketItems((current) =>
        current.map((item) => (item?.id !== draggedId ? item : null))
      );
      commitGameSession((currentSession) => ({
        ...currentSession,
        coins: purchase.user.coins,
        selectedAthleteIds: getSelectedAthleteIds(nextSlots),
      }));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsActionPending(false);
    }
  }

  function handlePlayMatch() {
    const onBoard = boardSlots.filter((s) => s.item !== null).length;
    if (onBoard === 0) {
      return;
    }

    const nextSession = writeGameSession({
      ...gameSession,
      selectedAthleteIds: getSelectedAthleteIds(boardSlots),
    });
    setGameSession(nextSession);
    router.push("/battle");
  }

  const athletesOnBoard = boardSlots.filter((s) => s.item !== null).length;

  return (
    <main className={styles.main}>
      <span className={styles.brandFloating} aria-label="AutoSoccer">
        <img src="/logo.png" alt="AutoSoccer" />
      </span>
      <ProfileCorner coins={coins} />

      <div className={styles.gameShell}>
        <section className={styles.boardSection} aria-labelledby="board-title">
          <div className={styles.boardHeader}>
            <div className={styles.boardHeaderTop}>
              <h2 id="board-title" className={styles.boardTitle}>
                Planejamento da Equipe
              </h2>
              <button
                type="button"
                className={styles.playButton}
                onClick={handlePlayMatch}
                disabled={athletesOnBoard === 0 || isLoading || isActionPending}
                title={
                  athletesOnBoard === 0
                    ? "Escale ao menos 1 atleta para jogar"
                    : "Iniciar partida"
                }
              >
                <PlayCircleFilled />
                Jogar
              </button>
            </div>

            <div className={styles.matchHud} aria-label="Resumo da partida">
              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Moedas</span>
                <span className={styles.hudValue}>
                  <DollarOutlined />
                  {coins}
                </span>
              </div>

              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Rodada</span>
                <span className={styles.hudValue}>{currentBattle}</span>
              </div>

              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Vitorias</span>
                <span className={styles.hudValue}>
                  <TrophyFilled />
                  {victories}/{WINS_TO_FINISH}
                </span>
              </div>

              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Vidas</span>
                <span className={styles.hudValue}>
                  <HeartFilled />
                  {lives}
                </span>
              </div>
            </div>

            {errorMessage && (
              <p className={styles.marketHint} role="alert">
                {errorMessage}
              </p>
            )}
          </div>

          <div className={styles.boardStage}>
            <div className={styles.goalNet} aria-hidden="true" />
            <div className={styles.pitchCircle} aria-hidden="true" />
            <div className={styles.pitchQuarterArc} aria-hidden="true" />

            <div className={styles.boardAreas}>
              {[0, 1, 2].map((areaIndex) => {
                const slotsInArea = boardSlots.filter(
                  (s) => s.areaIndex === areaIndex
                );

                return (
                  <div key={`area-${areaIndex}`} className={styles.fieldArea}>
                    <h3 className={styles.areaLabel}>{areaLabels[areaIndex]}</h3>
                    <div className={styles.slotsGrid}>
                      {slotsInArea.map((slot) => (
                        <div
                          key={slot.id}
                          className={`${styles.fieldSlot} ${
                            dragOverId === slot.id ? styles.fieldSlotActive : ""
                          }`}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDragOverId(slot.id);
                          }}
                          onDragLeave={() => setDragOverId(null)}
                          onDrop={(event) => void handleDrop(event, slot.id)}
                          aria-label={`Vaga ${slot.slotIndex + 1} em ${areaLabels[areaIndex]}`}
                        >
                          {slot.item ? (
                            <div
                              className={styles.boardItem}
                              draggable
                              onDragStart={(event) =>
                                handleDragStartFromSlot(
                                  event,
                                  slot.item!.id,
                                  slot.id
                                )
                              }
                              onDragEnd={handleDragEndFromSlot}
                              aria-label={`${slot.item.name} em campo`}
                              title="Arraste para mover ou vender"
                            >
                              {renderAthleteIcon(slot.item.icon, styles.itemIcon)}
                              <span className={styles.itemName}>
                                {slot.item.name}
                              </span>
                            </div>
                          ) : (
                            <span className={styles.emptySlot}>+</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className={styles.sidebar}>
          <section className={styles.marketSection} aria-labelledby="market-title">
            <div className={styles.marketHeader}>
              <h1 id="market-title" className={styles.title}>
                Mercado
              </h1>
              <p className={styles.marketHint}>
                {isLoading
                  ? "Carregando..."
                  : `Itens disponiveis: ${availableCount} / ${marketItems.length}`}
              </p>
            </div>

            <div className={styles.marketGrid}>
              {marketItems.map((item, index) => (
                <AthleteMarketItemCard
                  key={item?.id ?? `empty-${index + 1}`}
                  item={item}
                  index={index}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<ReloadOutlined />}
              aria-label={`Atualizar Mercado por ${refreshCost} moeda`}
              onClick={() => void handleRotateMarket()}
              disabled={isLoading || isActionPending || coins < refreshCost}
              style={{
                height: 52,
                fontSize: "1.1rem",
                fontWeight: 800,
                border: "4px solid #1f2937",
                boxShadow: "0 5px 0 #b45309",
                textShadow: "0 2px 0 rgba(0,0,0,0.15)",
              }}
            >
              Atualizar Mercado ({refreshCost} <DollarOutlined aria-hidden="true" />)
            </Button>
          </section>

          <div
            className={`${styles.sellDropZone} ${
              isSellZoneActive ? styles.sellDropZoneActive : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverId(null);
              setIsSellZoneActive(true);
            }}
            onDragLeave={() => setIsSellZoneActive(false)}
            onDrop={handleSellDrop}
            aria-label="Arraste um atleta para vender por 2 moedas"
            title="Vender atleta por 2 moedas"
          >
            <img
              src="/sell-boots-cropped.png"
              alt=""
              className={styles.sellDropImage}
              aria-hidden="true"
            />
            <span className={styles.sellDropLabel}>Venda</span>
            <span className={styles.sellDropReward}>+2</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
