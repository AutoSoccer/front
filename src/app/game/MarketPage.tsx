"use client";

import {
  DollarOutlined,
  HeartFilled,
  PlayCircleFilled,
  ReloadOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import { Button } from "antd";
import { useMemo, useState } from "react";

import AthleteMarketItemCard from "@/components/AthleteMarketItem";
import ProfileCorner from "@/components/ProfileCorner";

import { athletePool, type AthleteMarketItem } from "./athletes";
import styles from "./MarketPage.module.css";

type BoardSlot = {
  id: string;
  areaIndex: number;
  slotIndex: number;
  item: AthleteMarketItem | null;
};

const areaLabels = ["Defesa", "Centro", "Ataque"];

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

  const availableCount = useMemo(
    () => marketItems.filter((item) => item !== null).length,
    [marketItems]
  );

  function handleRotateMarket() {
    if (coins < 1) return;
    setCoins((c) => c - 1);
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
    setCoins((c) => c + 2);
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
      if (athletesInTargetArea >= 3) return;

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

    const athletesOnBoard = boardSlots.filter((s) => s.item !== null).length;
    if (athletesOnBoard >= 5) return;

    const athletesInArea = boardSlots.filter(
      (s) => s.areaIndex === targetSlot.areaIndex && s.item !== null
    ).length;
    if (athletesInArea >= 3) return;

    if (coins < 3) return;
    setCoins((c) => c - 3);

    setBoardSlots((current) =>
      current.map((slot) =>
        slot.id === slotId ? { ...slot, item: draggedItem } : slot
      )
    );

    setMarketItems((current) =>
      current.map((item) => (item?.id !== draggedId ? item : null))
    );
  }

  function handlePlayMatch() {
    const onBoard = boardSlots.filter((s) => s.item !== null).length;
    if (onBoard === 0) {
      return;
    }
    // TODO: integrar com simulacao de partida
    alert(`Iniciando partida com ${onBoard} atleta(s) em campo!`);
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
                disabled={athletesOnBoard === 0}
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
                <span className={styles.hudValue}>{currentRound}</span>
              </div>

              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Vitórias</span>
                <span className={styles.hudValue}>
                  <TrophyFilled />
                  {victories}
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
                          onDrop={(event) => handleDrop(event, slot.id)}
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
                              onClick={() => handleSellAthlete(slot.id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  handleSellAthlete(slot.id);
                                }
                              }}
                              aria-label={`${slot.item.name} - clique para vender por 2 moedas`}
                              title="Clique para vender por 2 moedas"
                            >
                              {renderAthleteIcon(slot.item.icon, styles.itemIcon)}
                              <span className={styles.itemName}>
                                {slot.item.name}
                              </span>
                              <span className={styles.sellPrice}>+2 🪙</span>
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

        <aside className={styles.marketSection} aria-labelledby="market-title">
          <div className={styles.marketHeader}>
            <h1 id="market-title" className={styles.title}>
              Mercado
            </h1>
            <p className={styles.marketHint}>
              Itens disponíveis: {availableCount} / 3
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
            onClick={handleRotateMarket}
            disabled={coins < 1}
            style={{
              height: 52,
              fontSize: "1.1rem",
              fontWeight: 800,
              border: "4px solid #1f2937",
              boxShadow: "0 5px 0 #b45309",
              textShadow: "0 2px 0 rgba(0,0,0,0.15)",
            }}
          >
            Atualizar Mercado · 1 🪙
          </Button>
        </aside>
      </div>
    </main>
  );
}
