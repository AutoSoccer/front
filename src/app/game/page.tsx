"use client";

import { RefreshCw, Shield, Swords } from "lucide-react";
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
      <section className={styles.marketSection} aria-labelledby="market-title">
        <div className={styles.marketHeader}>
          <div>
            <p className={styles.kicker}>Mercado</p>
            <h1 id="market-title" className={styles.title}>
              Escolha seus elementos
            </h1>
          </div>

          <button
            type="button"
            className={styles.rotateButton}
            onClick={handleRotateMarket}
            aria-label="Rotacionar mercado"
          >
            <RefreshCw size={16} />
            Rotacionar
          </button>
        </div>

        <p className={styles.marketHint}>Itens disponiveis: {availableCount} / 3</p>

        <div className={styles.marketGrid}>
          {marketItems.map((item, index) => {
            if (!item) {
              return (
                <div key={`empty-${index + 1}`} className={styles.marketSlotEmpty}>
                  <span>Espaco vazio</span>
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
                <span className={styles.itemIcon}>{item.icon}</span>
                <span className={styles.itemName}>{item.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.boardSection} aria-labelledby="board-title">
        <h2 id="board-title" className={styles.boardTitle}>
          Campo Central
        </h2>
        <p className={styles.boardHint}>Segure e arraste um item do mercado para uma das 5 caixas.</p>

        <div className={styles.boardGrid}>
          {boardSlots.map((slot, index) => (
            <div
              key={slot.id}
              className={`${styles.boardBox} ${dragOverId === slot.id ? styles.boardBoxActive : ""}`}
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
                <span className={styles.dropText}>Solte aqui</span>
              )}
            </div>
          ))}
        </div>

        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <Swords size={14} />
            Ataque
          </span>
          <span className={styles.legendItem}>
            <Shield size={14} />
            Defesa
          </span>
        </div>

        <p className={styles.liveMessage} role="status" aria-live="polite">
          {message}
        </p>
      </section>
    </main>
  );
}