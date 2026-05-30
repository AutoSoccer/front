"use client";

import type { MarketAthlete } from "@/types/game";

import styles from "./MarketAthleteCard.module.css";

export type MarketAthleteCardProps = {
  athlete: MarketAthlete;
  owned: boolean;
  disabled: boolean;
  onBuy: (athlete: MarketAthlete) => void;
};

/**
 * Card do mercado com o visual arcade original (avatar + nome + tag + grid de
 * atributos), adaptado aos dados reais da API. Clicar contrata o atleta.
 */
export default function MarketAthleteCard({
  athlete,
  owned,
  disabled,
  onBuy,
}: MarketAthleteCardProps) {
  return (
    <button
      type="button"
      className={styles.marketSlot}
      onClick={() => onBuy(athlete)}
      disabled={disabled || owned}
      aria-label={`Contratar ${athlete.name} por ${athlete.cost} moedas`}
      title={
        owned
          ? "Já no elenco"
          : disabled
            ? "Moedas insuficientes"
            : `Contratar por ${athlete.cost}`
      }
    >
      <div className={styles.cardAvatar}>
        <img
          src="/athlete.svg"
          alt=""
          className={styles.cardAvatarImage}
          aria-hidden="true"
        />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <span className={styles.cardName}>{athlete.name}</span>
          <span
            className={`${styles.cardTag} ${owned ? styles.cardTagOwned : ""}`}
          >
            {owned ? "No elenco" : "Atleta"}
          </span>
        </div>

        <div className={styles.cardStats}>
          <span className={styles.statsLine}>
            <strong className={styles.statLabel}>ATK</strong>
            <span className={styles.statValue}>{athlete.attack}</span>
          </span>
          <span className={styles.statsLine}>
            <strong className={styles.statLabel}>VEL</strong>
            <span className={styles.statValue}>{athlete.velocity}</span>
          </span>
          <span className={styles.statsLine}>
            <strong className={styles.statLabel}>DEF</strong>
            <span className={styles.statValue}>{athlete.defense}</span>
          </span>
          <span className={`${styles.statsLine} ${styles.costLine}`}>
            <strong className={styles.statLabel}>💰</strong>
            <span className={`${styles.statValue} ${styles.costValue}`}>
              {athlete.cost}
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
