"use client";

import { DollarOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

import styles from "./ProfileCorner.module.css";

type Props = {
  coins?: number;
};

export default function ProfileCorner({ coins }: Props) {
  const router = useRouter();

  return (
    <div className={styles.profileWrapper}>
      {coins !== undefined && (
        <span className={styles.coinPill}>
          <DollarOutlined />
          {coins}
        </span>
      )}
      <button
        type="button"
        className={styles.profileButton}
        onClick={() => router.push("/profile")}
        aria-label="Abrir perfil"
      >
        <UserOutlined />
      </button>
    </div>
  );
}
