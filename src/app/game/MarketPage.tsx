"use client";

import {
  DollarOutlined,
  PlayCircleFilled,
  ReloadOutlined,
  ShoppingOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import { Button, message } from "antd";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import ProfileCorner from "@/components/ProfileCorner";
import { gameService } from "@/services/gameService";
import type { MarketAthlete, ShopItem, TeamAthlete } from "@/types/game";

import styles from "./MarketPage.module.css";

const areaLabels = ["Defesa", "Centro", "Ataque"];
const TEAM_MAX = 6;
const GRID_COLS = 3;

// Linha do grid (posY) sugerida por tipo de atleta — formacao pre-determinada (RF008).
function rowForType(type: TeamAthlete["type"]): number {
  if (type === "goalkeeper" || type === "defender") return 0;
  if (type === "attacker") return 2;
  return 1;
}

type BoardSlot = {
  posX: number;
  posY: number;
  athlete: TeamAthlete | null;
};

function emptyBoard(): BoardSlot[] {
  const slots: BoardSlot[] = [];
  for (let posY = 0; posY < 3; posY++) {
    for (let posX = 0; posX < 3; posX++) {
      slots.push({ posX, posY, athlete: null });
    }
  }
  return slots;
}

/** Distribui os atletas do time no grid pela linha sugerida do tipo. */
function placeTeamOnBoard(athletes: TeamAthlete[]): BoardSlot[] {
  const board = emptyBoard();
  const used = new Set<number>();
  for (const athlete of athletes) {
    const preferredRow = rowForType(athlete.type);
    const rowOrder = [preferredRow, 1, 0, 2].filter(
      (row, idx, arr) => arr.indexOf(row) === idx
    );
    let placed = false;
    for (const posY of rowOrder) {
      for (let posX = 0; posX < GRID_COLS && !placed; posX++) {
        const slot = board.find((s) => s.posX === posX && s.posY === posY);
        if (slot && slot.athlete === null) {
          slot.athlete = athlete;
          used.add(athlete.id);
          placed = true;
        }
      }
      if (placed) break;
    }
  }
  return board;
}

function slotKey(posX: number, posY: number): string {
  return `${posX},${posY}`;
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}

export default function MarketPage() {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const [coins, setCoins] = useState(0);
  const [market, setMarket] = useState<MarketAthlete[]>([]);
  const [refreshCost, setRefreshCost] = useState(0);
  const [team, setTeam] = useState<TeamAthlete[]>([]);
  const [board, setBoard] = useState<BoardSlot[]>(() => emptyBoard());
  const [items, setItems] = useState<ShopItem[]>([]);
  const [round, setRound] = useState(1);
  const [victory, setVictory] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const athletesOnBoard = useMemo(
    () => board.filter((slot) => slot.athlete !== null).length,
    [board]
  );

  // Carrega mercado, equipe e itens do backend em paralelo.
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [marketData, teamData, itemsData] = await Promise.all([
        gameService.getMarket(),
        gameService.getTeam(),
        gameService.getItems().catch(() => []),
      ]);

      setMarket(marketData.athletes);
      setRefreshCost(marketData.refresh_cost);
      setItems(itemsData);

      if (teamData) {
        setTeam(teamData.athletes);
        setBoard(placeTeamOnBoard(teamData.athletes));
        setRound(teamData.round);
        setVictory(teamData.victory);
      } else {
        setTeam([]);
        setBoard(emptyBoard());
      }
    } catch (error) {
      messageApi.error(apiErrorMessage(error, "Falha ao carregar o jogo."));
    } finally {
      setIsLoading(false);
    }
  }, [messageApi]);

  // Saldo de moedas vem do perfil (/auth/me).
  const refreshCoins = useCallback(async () => {
    try {
      const raw = localStorage.getItem("user");
      const stored = raw ? (JSON.parse(raw) as { coins?: number }) : null;
      if (stored?.coins !== undefined) {
        setCoins(stored.coins);
      }
    } catch {
      // ignora — o saldo aparece apos a primeira acao do backend.
    }
  }, []);

  useEffect(() => {
    // Defere para fora do corpo sincrono do effect (evita setState sincrono).
    const timer = setTimeout(() => {
      void loadAll();
      void refreshCoins();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadAll, refreshCoins]);

  const ownedIds = useMemo(() => new Set(team.map((a) => a.id)), [team]);

  async function handleBuyAthlete(athlete: MarketAthlete) {
    if (isBusy) return;
    if (team.length >= TEAM_MAX) {
      messageApi.warning(`Time cheio (max ${TEAM_MAX} atletas).`);
      return;
    }
    setIsBusy(true);
    try {
      const result = await gameService.buyAthlete(athlete.id);
      if (result?.user?.coins !== undefined) {
        setCoins(result.user.coins);
      }
      messageApi.success(`${athlete.name} contratado!`);
      await loadAll();
    } catch (error) {
      messageApi.error(apiErrorMessage(error, "Nao foi possivel comprar o atleta."));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRefreshMarket() {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const data = await gameService.refreshMarket();
      setMarket(data.athletes);
      setRefreshCost(data.refresh_cost);
      messageApi.success("Mercado atualizado.");
    } catch (error) {
      messageApi.error(apiErrorMessage(error, "Nao foi possivel atualizar o mercado."));
    } finally {
      setIsBusy(false);
    }
  }

  // ----- Drag & drop para posicionar atletas do time no grid -----
  function handleDragStart(event: React.DragEvent, athleteId: number, from: string) {
    event.dataTransfer.setData("athleteId", String(athleteId));
    event.dataTransfer.setData("from", from);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDropOnSlot(event: React.DragEvent, posX: number, posY: number) {
    event.preventDefault();
    setDragOverKey(null);
    const athleteId = Number(event.dataTransfer.getData("athleteId"));
    if (!athleteId) return;

    setBoard((current) => {
      const next = current.map((slot) => ({ ...slot }));
      const target = next.find((s) => s.posX === posX && s.posY === posY);
      if (!target) return current;

      const source = next.find((s) => s.athlete?.id === athleteId);
      const athlete =
        source?.athlete ?? team.find((a) => a.id === athleteId) ?? null;
      if (!athlete) return current;

      if (target.athlete && source) {
        // troca de posicoes
        source.athlete = target.athlete;
      } else if (source) {
        source.athlete = null;
      }
      target.athlete = athlete;
      return next;
    });
  }

  function handleRemoveFromBoard(posX: number, posY: number) {
    setBoard((current) =>
      current.map((slot) =>
        slot.posX === posX && slot.posY === posY ? { ...slot, athlete: null } : slot
      )
    );
  }

  // Atletas do time ainda nao posicionados no grid (banco de reservas).
  const benchAthletes = useMemo(() => {
    const placed = new Set(
      board.filter((s) => s.athlete).map((s) => s.athlete!.id)
    );
    return team.filter((a) => !placed.has(a.id));
  }, [board, team]);

  async function handlePlay() {
    if (isBusy) return;
    if (athletesOnBoard !== TEAM_MAX) {
      messageApi.warning(
        `Posicione exatamente ${TEAM_MAX} atletas para jogar (atual: ${athletesOnBoard}).`
      );
      return;
    }
    setIsBusy(true);
    try {
      const positions = board
        .filter((slot) => slot.athlete !== null)
        .map((slot) => ({
          athleteId: slot.athlete!.id,
          posX: slot.posX,
          posY: slot.posY,
        }));
      const snap = await gameService.salvarEstado(positions);
      // Passa o snapshot para a batalha jogar exatamente esta formacao.
      sessionStorage.setItem("autosoccer:snapshotId", String(snap.snapshotId));
      router.push("/battle");
    } catch (error) {
      messageApi.error(apiErrorMessage(error, "Nao foi possivel salvar a formacao."));
      setIsBusy(false);
    }
  }

  return (
    <main className={styles.main}>
      {contextHolder}
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
                onClick={handlePlay}
                disabled={isBusy || athletesOnBoard !== TEAM_MAX}
                title={
                  athletesOnBoard !== TEAM_MAX
                    ? `Posicione ${TEAM_MAX} atletas para jogar`
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
                <span className={styles.hudValue}>{round}</span>
              </div>
              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Vitórias</span>
                <span className={styles.hudValue}>
                  <TrophyFilled />
                  {victory}
                </span>
              </div>
              <div className={styles.hudItem}>
                <span className={styles.hudLabel}>Elenco</span>
                <span className={styles.hudValue}>
                  {team.length}/{TEAM_MAX}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.boardStage}>
            <div className={styles.goalNet} aria-hidden="true" />
            <div className={styles.pitchCircle} aria-hidden="true" />
            <div className={styles.pitchQuarterArc} aria-hidden="true" />

            <div className={styles.boardAreas}>
              {[0, 1, 2].map((posY) => (
                <div key={`area-${posY}`} className={styles.fieldArea}>
                  <h3 className={styles.areaLabel}>{areaLabels[posY]}</h3>
                  <div className={styles.slotsGrid}>
                    {[0, 1, 2].map((posX) => {
                      const slot = board.find(
                        (s) => s.posX === posX && s.posY === posY
                      )!;
                      const key = slotKey(posX, posY);
                      return (
                        <div
                          key={key}
                          className={`${styles.fieldSlot} ${
                            dragOverKey === key ? styles.fieldSlotActive : ""
                          }`}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDragOverKey(key);
                          }}
                          onDragLeave={() => setDragOverKey(null)}
                          onDrop={(event) => handleDropOnSlot(event, posX, posY)}
                          aria-label={`Vaga ${posX + 1} em ${areaLabels[posY]}`}
                        >
                          {slot.athlete ? (
                            <div
                              className={styles.boardItem}
                              draggable
                              onDragStart={(event) =>
                                handleDragStart(event, slot.athlete!.id, "board")
                              }
                              onDoubleClick={() =>
                                handleRemoveFromBoard(posX, posY)
                              }
                              title="Arraste para mover · clique duplo para tirar"
                            >
                              <span className={styles.itemName}>
                                {slot.athlete.name}
                              </span>
                              <span className={styles.itemOverall}>
                                {slot.athlete.overall}
                              </span>
                            </div>
                          ) : (
                            <span className={styles.emptySlot}>+</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {benchAthletes.length > 0 && (
            <div className={styles.bench} aria-label="Reservas">
              <span className={styles.benchLabel}>Reservas:</span>
              {benchAthletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className={styles.benchItem}
                  draggable
                  onDragStart={(event) =>
                    handleDragStart(event, athlete.id, "bench")
                  }
                  title="Arraste para o campo"
                >
                  {athlete.name} · {athlete.overall}
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className={styles.sidebar}>
          <section className={styles.marketSection} aria-labelledby="market-title">
            <div className={styles.marketHeader}>
              <h1 id="market-title" className={styles.title}>
                Mercado
              </h1>
              <p className={styles.marketHint}>
                {isLoading ? "Carregando..." : `${market.length} atletas`}
              </p>
            </div>

            <div className={styles.marketGrid}>
              {market.map((athlete) => {
                const owned = ownedIds.has(athlete.id) || athlete.status === "OWNED";
                return (
                  <button
                    key={athlete.id}
                    type="button"
                    className={styles.marketItem}
                    onClick={() => handleBuyAthlete(athlete)}
                    disabled={isBusy || owned || coins < athlete.cost}
                    title={
                      owned
                        ? "Ja contratado"
                        : coins < athlete.cost
                          ? "Moedas insuficientes"
                          : `Contratar por ${athlete.cost}`
                    }
                  >
                    <span className={styles.itemName}>{athlete.name}</span>
                    <div className={styles.itemStats}>
                      <span className={styles.statChip}>ATK {athlete.attack}</span>
                      <span className={styles.statChip}>VEL {athlete.velocity}</span>
                      <span className={styles.statChip}>DEF {athlete.defense}</span>
                    </div>
                    <span className={styles.itemCost}>
                      {owned ? "No elenco" : `${athlete.cost} 🪙`}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<ReloadOutlined />}
              onClick={handleRefreshMarket}
              disabled={isBusy}
              style={{
                height: 52,
                fontSize: "1.1rem",
                fontWeight: 800,
                border: "4px solid #1f2937",
                boxShadow: "0 5px 0 #b45309",
              }}
            >
              Atualizar Mercado{refreshCost > 0 ? ` · ${refreshCost} 🪙` : ""}
            </Button>
          </section>

          {items.length > 0 && (
            <section className={styles.marketSection} aria-label="Loja de itens">
              <div className={styles.marketHeader}>
                <h2 className={styles.title}>
                  <ShoppingOutlined /> Itens
                </h2>
              </div>
              <div className={styles.itemsList}>
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    disabled={isBusy || coins < item.cost}
                    onBuy={async () => {
                      setIsBusy(true);
                      try {
                        const r = await gameService.buyItem(item.id);
                        if (r?.user?.coins !== undefined) setCoins(r.user.coins);
                        messageApi.success(`${item.name} comprado!`);
                      } catch (error) {
                        messageApi.error(
                          apiErrorMessage(error, "Nao foi possivel comprar o item.")
                        );
                      } finally {
                        setIsBusy(false);
                      }
                    }}
                  />
                ))}
              </div>
              <p className={styles.itemsHint}>
                Compre itens e aplique-os aos atletas no modo de preparacao.
              </p>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

function ItemRow({
  item,
  disabled,
  onBuy,
}: {
  item: ShopItem;
  disabled: boolean;
  onBuy: () => void;
}) {
  const mods: string[] = [];
  if (item.modifiers.attack) mods.push(`ATK +${item.modifiers.attack}`);
  if (item.modifiers.defense) mods.push(`DEF +${item.modifiers.defense}`);
  if (item.modifiers.velocity) mods.push(`VEL +${item.modifiers.velocity}`);

  return (
    <div className={styles.itemRow}>
      <div className={styles.itemRowInfo}>
        <strong>{item.name}</strong>
        <span className={styles.itemRowMods}>{mods.join(" · ")}</span>
      </div>
      <Button size="small" onClick={onBuy} disabled={disabled}>
        {item.cost} 🪙
      </Button>
    </div>
  );
}
