"use client";

import {
  HomeFilled,
  TeamOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import Link from "next/link";

import ProfileCorner from "@/components/ProfileCorner";
import { useAuth } from "@/hooks/useAuth";

import styles from "./page.module.css";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <main className={styles.main}>
      <span className={styles.brandFloating}>
        AutoSoccer
        <span className={styles.brandSub}>⚽</span>
      </span>

      {isAuthenticated && <ProfileCorner />}

      {isLoading ? (
        <p className={styles.loadingState}>Carregando...</p>
      ) : (
        <div className={styles.menu}>
          <Link href="/game" className={`${styles.menuButton} ${styles.menuButtonHero}`}>
            Jogar <TrophyFilled />
          </Link>
          <Link href="/game" className={styles.menuButton}>
            Atletas
          </Link>
          <Link href="/profile" className={styles.menuButton}>
            <TeamOutlined /> Perfil
          </Link>
          <Link href="/game" className={styles.menuButton}>
            Histórico
          </Link>

          {!isAuthenticated && (
            <p className={styles.guestNotice}>
              Você está em modo visitante.{" "}
              <Link href="/auth/login" className={styles.guestLink}>
                Entrar
              </Link>{" "}
              ou{" "}
              <Link href="/auth/register" className={styles.guestLink}>
                criar conta
              </Link>{" "}
              para salvar seu progresso.
            </p>
          )}
        </div>
      )}

      <div className={styles.menuFooter}>
        <Link href="/" className={styles.footerButton} aria-label="Inicio">
          <HomeFilled />
        </Link>
      </div>

      <div className={styles.tipBox}>You look great today!</div>
    </main>
  );
}
