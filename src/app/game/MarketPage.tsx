"use client";

import { Coins, Heart, RefreshCw, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";

import AthleteMarketItemCard from "@/components/AthleteMarketItem";
import DashboardShell from "@/components/DashboardShell";

import { athletePool, type AthleteMarketItem } from "./athletes";
import styles from "./MarketPage.module.css";

type BoardSlot = {
  id: string;
  areaIndex: number;
  slotIndex: number;
  item: AthleteMarketItem | null;
};

const areaLabels = ["Defesa", "Centro", "Ataque"];
const REFRESH_COST = 1;
const BUY_COST = 3;
const SELL_REWARD = 2;
const MAX_PER_AREA = 3;
const MAX_ON_BOARD = 5;

function createBoardSlots(): BoardSlot[] {
  const slots: BoardSlot[] = [];
  for (let areaIndex = 0; areaIndex < 3; areaIndex++) {
    for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
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

function shuffleItems(
  items: Array<AthleteMarketItem | null>
): Array<AthleteMarketItem | null> {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [next[i], next[randomIndex]] = [next[randomIndex], next[i]];
  }
  return next;
}

function renderAthleteIcon(icon: string, className: string) {
  if (icon.startsWith("/")) {
    return <img src={icon} alt="" className={className} aria-hidden="true" />;
  }
  return <span className={className}>{icon}</span>;
}

export default function MarketPage() {
  const [marketItems, setMarketItems] = useState<Array<AthleteMarketItem | null>>(
    athletePool.slice(0, 3)
  );
  const [boardSlots, setBoardSlots] = useState<BoardSlot[]>(createBoardSlots);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [coins, setCoins] = useState(10);

  const currentRound = 1;
  const victories = 0;
  const lives = 5;
  const athletesOnBoard = boardSlots.filter((s) => s.item !== null).length;

  const availableCount = useMemo(
    () => marketItems.filter((item) => item !== null).length,
    [marketItems]
  );

  function handleRotateMarket() {
    if (coins < REFRESH_COST) return;
    setCoins((c) => c - REFRESH_COST);
    setMarketItems(() => shuffleItems(athletePool).slice(0, 3));
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

  function handleSellAthlete(slotId: string) {
    setBoardSlots((current) =>
      current.map((slot) => (slot.id === slotId ? { ...slot, item: null } : slot))
    );
    setCoins((c) => c + SELL_REWARD);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>, slotId: string) {
    event.preventDefault();
    setDragOverId(null);

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
      if (athletesInTargetArea >= MAX_PER_AREA) return;

      setBoardSlots((current) =>
        current.map((slot) => {
          if (slot.id === sourceSlotId) return { ...slot, item: null };
          if (slot.id === slotId) return { ...slot, item: sourceSlot.item };
          return slot;
        })
      );
      return;
    }

    const draggedItem = marketItems.find((item) => item?.id === draggedId);
    if (!draggedItem) return;

    const alreadyOnBoard = boardSlots.some(
      (slot) => slot.item?.id === draggedId
    );
    if (alreadyOnBoard) return;

    if (athletesOnBoard >= MAX_ON_BOARD) return;

    const athletesInArea = boardSlots.filter(
      (s) => s.areaIndex === targetSlot.areaIndex && s.item !== null
    ).length;
    if (athletesInArea >= MAX_PER_AREA) return;

    if (coins < BUY_COST) return;
    setCoins((c) => c - BUY_COST);

    setBoardSlots((current) =>
      current.map((slot) =>
        slot.id === slotId ? { ...slot, item: draggedItem } : slot
      )
    );

    setMarketItems((current) =>
      current.map((item) => (item?.id !== draggedId ? item : null))
    );
  }

  return (
    <DashboardShell>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Mercado de Atletas</h1>
          <p className={styles.subtitle}>
            Compre atletas, monte sua formação e arraste para o campo.
          </p>
        </div>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statIcon}>
            <Coins size={16} />
          </span>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Moedas</span>
            <span className={styles.statValue}>{coins}</span>
          </div>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statIcon}>
            <Users size={16} />
          </span>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Rodada</span>
            <span className={styles.statValue}>{currentRound}</span>
          </div>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statIcon}>
            <Trophy size={16} />
          </span>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Vitórias</span>
            <span className={styles.statValue}>{victories}</span>
          </div>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statIcon}>
            <Heart size={16} />
          </span>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Vidas</span>
            <span className={styles.statValue}>{lives}</span>
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        <section className={styles.fieldCard} aria-labelledby="board-title">
          <div className={styles.fieldHeader}>
            <h2 id="board-title" className={styles.fieldTitle}>
              Planejamento da Equipe
            </h2>
            <p className={styles.fieldHint}>
              {athletesOnBoard}/{MAX_ON_BOARD} em campo · até{" "}
              {MAX_PER_AREA} por área
            </p>
          </div>

          <div className={styles.field}>
            <div className={styles.areas}>
              {[0, 1, 2].map((areaIndex) => {
                const slotsInArea = boardSlots.filter(
                  (s) => s.areaIndex === areaIndex
                );
                return (
                  <div key={`area-${areaIndex}`} className={styles.areaColumn}>
                    <span className={styles.areaLabel}>
                      {areaLabels[areaIndex]}
                    </span>
                    <div className={styles.slotsList}>
                      {slotsInArea.map((slot) => {
                        const isActive = dragOverId === slot.id;
                        return (
                          <div
                            key={slot.id}
                            className={`${styles.slot} ${
                              isActive ? styles.slotActive : ""
                            }`}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDragOverId(slot.id);
                            }}
                            onDragLeave={() => setDragOverId(null)}
                            onDrop={(event) => handleDrop(event, slot.id)}
                            aria-label={`Slot ${slot.slotIndex + 1} em ${areaLabels[areaIndex]}`}
                          >
                            {slot.item ? (
                              <div
                                className={styles.slotFilled}
                                draggable
                                onDragStart={(event) =>
                                  handleDragStartFromSlot(
                                    event,
                                    slot.item!.id,
                                    slot.id
                                  )
                                }
                                onClick={() => handleSellAthlete(slot.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    handleSellAthlete(slot.id);
                                  }
                                }}
                                aria-label={`${slot.item.name} - clique para vender por ${SELL_REWARD} moedas`}
                                title={`Clique para vender por ${SELL_REWARD} moedas`}
                              >
                                {renderAthleteIcon(slot.item.icon, styles.slotIcon)}
                                <span className={styles.slotName}>
                                  {slot.item.name}
                                </span>
                                <span className={styles.sellHint}>
                                  +{SELL_REWARD} 🪙
                                </span>
                              </div>
                            ) : (
                              <span className={styles.slotPlus}>+</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className={styles.marketCard} aria-labelledby="market-title">
          <div className={styles.marketTop}>
            <h2 id="market-title" className={styles.marketTitle}>
              Mercado
            </h2>
            <span className={styles.marketAvail}>
              {availableCount}/3 disponíveis
            </span>
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

          <button
            type="button"
            className={styles.refreshButton}
            onClick={handleRotateMarket}
            disabled={coins < REFRESH_COST}
            aria-label="Atualizar mercado"
            title={
              coins < REFRESH_COST
                ? "Saldo insuficiente"
                : `Custa ${REFRESH_COST} moeda`
            }
          >
            <RefreshCw size={16} />
            Atualizar Mercado · {REFRESH_COST} 🪙
          </button>
        </aside>
      </div>
    </DashboardShell>
  );
}
