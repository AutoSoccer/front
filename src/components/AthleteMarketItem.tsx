import type React from "react";

import { type AthleteMarketItem } from "../app/game/athletes";
import styles from "./AthleteMarketItem.module.css";

export type AthleteMarketItemProps = {
  item: AthleteMarketItem | null;
  index: number;
  onDragStart: (event: React.DragEvent<HTMLButtonElement>, itemId: string) => void;
};

function renderAthleteIcon(icon: string) {
  if (icon.startsWith("/")) {
    return <img src={icon} alt="" className={styles.cardAvatarImage} aria-hidden="true" />;
  }

  return <span className={styles.cardAvatarImage}>{icon}</span>;
}

export default function AthleteMarketItemCard({ item, index, onDragStart }: AthleteMarketItemProps) {
  if (!item) {
    return (
      <div className={styles.marketSlotEmpty}>
        <span>Vaga disponível {index + 1}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => onDragStart(event, item.id)}
      className={styles.marketSlot}
      aria-label={`Arrastar ${item.name} para o campo`}
    >
      <div className={styles.cardAvatar}>{renderAthleteIcon(item.icon)}</div>
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <span className={styles.cardName}>{item.name}</span>
          <span className={styles.cardTag}>{item.cost} moedas</span>
        </div>

        <div className={styles.cardStats}>
          <span className={styles.statsLine}>
            <strong className={styles.statLabel}>ATK</strong>
            <span className={styles.statValue}>{item.stats.atk}</span>
          </span>
          <span className={styles.statsLine}>
            <strong className={styles.statLabel}>VEL</strong>
            <span className={styles.statValue}>{item.stats.vel}</span>
          </span>
          <span className={styles.statsLine}>
            <strong className={styles.statLabel}>DEF</strong>
            <span className={styles.statValue}>{item.stats.def}</span>
          </span>
          <span className={`${styles.statsLine} ${styles.statsLineWide}`}>
            <strong className={styles.statLabel}>HAB</strong>
            <span
              className={`${styles.statValue} ${styles.statValueText}`}
              title={item.stats.hab}
            >
              {item.stats.hab.split(" ")[0]}
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
