"use client";

import { Coins, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import styles from "./game.module.css";

type MarketItem = {
  id: string;
  name: string;
  icon: string;
};

type BoardSlot = {
  id: string;
  item: MarketItem | null;
};

const initialMarket: Array<MarketItem | null> = [
  { id: "placeholder-1", name: "Espadachim", icon: "⚔️" },
  { id: "placeholder-2", name: "Guardião", icon: "🛡️" },
  { id: "placeholder-3", name: "Mago", icon: "✨" },
];

function createBoardSlots(): BoardSlot[] {
  return Array.from({ length: 5 }, (_, index) => ({
    id: `box-${index + 1}`,
    item: null,
  }));
}

function shuffleItems(items: Array<MarketItem | null>): Array<MarketItem | null> {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [next[i], next[randomIndex]] = [next[randomIndex], next[i]];
  }

  return next;
}

export default function GamePage() {
  const [marketItems, setMarketItems] = useState<Array<MarketItem | null>>(initialMarket);
  const [boardSlots, setBoardSlots] = useState<BoardSlot[]>(createBoardSlots);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [message, setMessage] = useState("Arraste um item do mercado para uma caixa no campo.");
  const [coins] = useState(4);

  const availableCount = useMemo(
    () => marketItems.filter((item) => item !== null).length,
    [marketItems],
  );

  function handleRotateMarket() {
    setMarketItems((current) => shuffleItems(current));
    setMessage("Mercado rotacionado.");
  }

  function handleDragStart(event: React.DragEvent<HTMLButtonElement>, itemId: string) {
    event.dataTransfer.setData("text/plain", itemId);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>, boxId: string) {
    event.preventDefault();
    setDragOverId(null);

    const draggedId = event.dataTransfer.getData("text/plain");

    if (!draggedId) {
      return;
    }

    const draggedItem = marketItems.find((item) => item?.id === draggedId);

    if (!draggedItem) {
      return;
    }

    const alreadyOnBoard = boardSlots.some((slot) => slot.item?.id === draggedId);

    if (alreadyOnBoard) {
      setMessage("Esse item ja esta no campo. Rotacione para trazer outro.");
      return;
    }

    setBoardSlots((current) =>
      current.map((slot) =>
        slot.id === boxId
          ? {
              ...slot,
              item: draggedItem,
            }
          : slot,
      ),
    );

    setMarketItems((current) =>
      current.map((item) => {
        if (item?.id !== draggedId) {
          return item;
        }

        return null;
      }),
    );

    setMessage(`${draggedItem.name} foi movido para o campo.`);
  }

  return (
    <main className={styles.main}>
      <div className={styles.gameShell}>
        <section className={styles.boardSection} aria-labelledby="board-title">
          <h2 id="board-title" className={styles.boardTitle}>
            Campo Central
          </h2>
          <p className={styles.boardHint}>Arraste um item para uma das 5 caixas do campo.</p>

          <div className={styles.boardStage}>
            <div className={styles.goalNet} aria-hidden="true" />
            <div className={styles.pitchCircle} aria-hidden="true" />
            <div className={styles.pitchQuarterArc} aria-hidden="true" />

            <div className={styles.dropLane}>
              {boardSlots.map((slot, index) => (
                <div
                  key={slot.id}
                  className={`${styles.boardBox} ${styles[`lane${index + 1}`]} ${dragOverId === slot.id ? styles.boardBoxActive : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverId(slot.id);
                  }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(event) => handleDrop(event, slot.id)}
                  aria-label={`Caixa ${index + 1} do campo`}
                >
                  {slot.item ? (
                    <div className={styles.boardItem}>
                      <span className={styles.itemIcon}>{slot.item.icon}</span>
                      <span className={styles.itemName}>{slot.item.name}</span>
                    </div>
                  ) : (
                    <span className={styles.dropText}>Caixa {index + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className={styles.liveMessage} role="status" aria-live="polite">
            {message}
          </p>
        </section>

        <aside className={styles.marketSection} aria-labelledby="market-title">
          <div className={styles.marketGrid}>
            {marketItems.map((item, index) => {
              if (!item) {
                return (
                  <div key={`empty-${index + 1}`} className={styles.marketSlotEmpty}>
                    <span>Placeholder vazio</span>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  onDragStart={(event) => handleDragStart(event, item.id)}
                  className={styles.marketSlot}
                  aria-label={`Arrastar ${item.name} para o campo`}
                >
                  <div className={styles.cardAvatar}>{item.icon}</div>
                  <div className={styles.cardStats}>
                    <span className={styles.statsLine}>ATK - 26&nbsp;&nbsp; DRI - 26</span>
                    <span className={styles.statsLine}>VEL - 26&nbsp;&nbsp; MAR - 26</span>
                    <span className={styles.statsLine}>DEF - 26&nbsp;&nbsp; FIS - 26</span>
                    <span className={styles.statsLine}>HAB - Chute Potente</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className={styles.marketFooter}>
            <h1 id="market-title" className={styles.title}>
              Mercado
            </h1>
            <p className={styles.marketHint}>Itens disponíveis: {availableCount} / 3</p>

            <button
              type="button"
              className={styles.rotateButton}
              onClick={handleRotateMarket}
              aria-label="Atualizar mercado"
            >
              <RefreshCw size={24} />
              Atualizar Mercado
            </button>

            <div className={styles.coinBox} aria-label={`Saldo atual: ${coins} moedas`}>
              <span>{coins}</span>
              <Coins size={30} />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}