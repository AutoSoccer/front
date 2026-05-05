"use client";

import { Coins, Heart, RefreshCw, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

import styles from "./MarketPage.module.css";

import AthleteMarketItemCard from "../../components/AthleteMarketItem";
import { athletePool, type AthleteMarketItem } from "./athletes";

type BoardSlot = {
  id: string;
  areaIndex: number; // 0 = Defesa, 1 = Centro, 2 = Ataque
  slotIndex: number; // 0, 1, 2 dentro da área
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

function shuffleItems(items: Array<AthleteMarketItem | null>): Array<AthleteMarketItem | null> {
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

export default function GamePage() {
  const [athleteMarketItems, setAthleteMarketItem] = useState<Array<AthleteMarketItem | null>>(athletePool.slice(0, 3));
  const [boardSlots, setBoardSlots] = useState<BoardSlot[]>(createBoardSlots);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // const [message, setMessage] = useState("Arraste um item do mercado para uma caixa no campo.");
  const [coins, setCoins] = useState(10);
  const currentRound = 1;
  const victories = 0;
  const lives = 5;

  const availableCount = useMemo(
    () => athleteMarketItems.filter((item) => item !== null).length,
    [athleteMarketItems],
  );

  function handleRotateMarket() {
    if (coins < 1) {
      // setMessage("Saldo insuficiente para rotacionar o mercado (4 moedas).");
      return;
    }

    setCoins((c) => c - 1);
    setAthleteMarketItem(() => shuffleItems(athletePool).slice(0, 3));
    // setMessage("Mercado rotacionado.");
  }

  function handleDragStart(event: React.DragEvent<HTMLButtonElement>, itemId: string) {
    event.dataTransfer.setData("text/plain", itemId);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragStartFromSlot(event: React.DragEvent<HTMLDivElement>, itemId: string, sourceSlotId: string) {
    event.dataTransfer.setData("itemId", itemId);
    event.dataTransfer.setData("sourceSlotId", sourceSlotId);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleSellAthlete(slotId: string, athlete: AthleteMarketItem) {
    // Remove o atleta do slot
    setBoardSlots((current) =>
      current.map((slot) =>
        slot.id === slotId ? { ...slot, item: null } : slot,
      ),
    );

    // Adiciona 2 moedas
    setCoins((c) => c + 2);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>, slotId: string) {
    event.preventDefault();
    setDragOverId(null);

    // Detecta se veio do mercado ou de um slot
    const sourceSlotId = event.dataTransfer.getData("sourceSlotId");
    const draggedId = event.dataTransfer.getData("itemId") || event.dataTransfer.getData("text/plain");

    if (!draggedId) {
      return;
    }

    const targetSlot = boardSlots.find((s) => s.id === slotId);
    if (!targetSlot) {
      return;
    }

    // Se slot alvo já tem item, rejeita
    if (targetSlot.item !== null) {
      // setMessage("Este slot já está ocupado.");
      return;
    }

    // Se veio de outro slot (movimentação no campo)
    if (sourceSlotId) {
      const sourceSlot = boardSlots.find((s) => s.id === sourceSlotId);
      if (!sourceSlot || !sourceSlot.item) {
        return;
      }

      // Valida se é permitido na nova área
      const athletesInTargetArea = boardSlots
        .filter((s) => s.areaIndex === targetSlot.areaIndex && s.item !== null).length;
      if (athletesInTargetArea >= 3) {
        // setMessage(`Máximo de 3 atletas na área de ${areaLabels[targetSlot.areaIndex]}.`);
        return;
      }

      // Move o atleta entre slots
      setBoardSlots((current) =>
        current.map((slot) => {
          if (slot.id === sourceSlotId) {
            return { ...slot, item: null };
          }
          if (slot.id === slotId) {
            return { ...slot, item: sourceSlot.item };
          }
          return slot;
        }),
      );

      // setMessage(`${sourceSlot.item.name} foi movido para ${areaLabels[targetSlot.areaIndex]}.`);
      return;
    }

    // Se veio do mercado
    const draggedItem = athleteMarketItems.find((item) => item?.id === draggedId);

    if (!draggedItem) {
      return;
    }

    // Verifica se o atleta já está no campo
    const alreadyOnBoard = boardSlots.some((slot) => slot.item?.id === draggedId);
    if (alreadyOnBoard) {
      // setMessage("Esse atleta já está no campo.");
      return;
    }

    // Conta quantos atletas já tem no campo
    const athletesOnBoard = boardSlots.filter((s) => s.item !== null).length;
    if (athletesOnBoard >= 5) {
      // setMessage("Campo cheio! Máximo de 5 atletas no total.");
      return;
    }

    // Conta quantos atletas já tem nesta área
    const athletesInArea = boardSlots
      .filter((s) => s.areaIndex === targetSlot.areaIndex && s.item !== null).length;
    if (athletesInArea >= 3) {
      return;
    }

    // Verifica saldo para compra
    if (coins < 3) {
      return;
    }
    setCoins((c) => c - 3);

    // Adiciona o atleta ao slot
    setBoardSlots((current) =>
      current.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              item: draggedItem,
            }
          : slot,
      ),
    );

    // Remove do mercado
    setAthleteMarketItem((current) =>
      current.map((item) => {
        if (item?.id !== draggedId) {
          return item;
        }

        return null;
      }),
    );

  }

  return (
    <main className={styles.main}>
      <div className={styles.gameShell}>
        <section className={styles.boardSection} aria-labelledby="board-title">
          <div className={styles.boardHeader}>
            <div>
              <h2 id="board-title" className={styles.boardTitle}>
                Planejamento da Equipe
              </h2>
            </div>

            <div className={styles.matchHud} aria-label="Resumo da partida">
              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Moedas</span>
                <span className={styles.hudValue}>
                  <Coins size={15} />
                  {coins}
                </span>
              </div>

              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Rodada</span>
                <span className={styles.hudValue}>{currentRound}</span>
              </div>

              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Vitorias</span>
                <span className={styles.hudValue}>
                  <Trophy size={15} />
                  {victories}
                </span>
              </div>

              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Vidas</span>
                <span className={styles.hudValue}>
                  <Heart size={15} />
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
                const slotsInArea = boardSlots.filter((s) => s.areaIndex === areaIndex);

                return (
                  <div key={`area-${areaIndex}`} className={styles.fieldArea}>
                    <h3 className={styles.areaLabel}>{areaLabels[areaIndex]}</h3>
                    <div className={styles.slotsGrid}>
                      {slotsInArea.map((slot) => (
                        <div
                          key={slot.id}
                          className={`${styles.fieldSlot} ${dragOverId === slot.id ? styles.fieldSlotActive : ""}`}
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
                              className={styles.boardItem}
                              draggable
                              onDragStart={(event) => handleDragStartFromSlot(event, slot.item!.id, slot.id)}
                              onClick={() => handleSellAthlete(slot.id, slot.item!)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  handleSellAthlete(slot.id, slot.item!);
                                }
                              }}
                              aria-label={`${slot.item.name} - clique para vender por 2 moedas`}
                              title="Clique para vender por 2 moedas"
                            >
                              {renderAthleteIcon(slot.item.icon, styles.itemIcon)}
                              <span className={styles.itemName}>{slot.item.name}</span>
                              <span className={styles.sellPrice}>+2💰</span>
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

          {/* <p className={styles.liveMessage} role="status" aria-live="polite">
            {message}
          </p> */}
        </section>

        <aside className={styles.marketSection} aria-labelledby="market-title">
          <div className={styles.marketGrid}>
            {athleteMarketItems.map((item, index) => {
              return (
                <AthleteMarketItemCard
                  key={item?.id ?? `empty-${index + 1}`}
                  item={item}
                  index={index}
                  onDragStart={handleDragStart}
                />
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
              <RefreshCw size={22} />
              <span>Atualizar Mercado</span>
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}