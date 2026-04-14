"use client";

import { LogIn, Store, Trophy, UserPlus } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.css";

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <main className={styles.main}>
        <p className={styles.loadingText}>Carregando...</p>
      </main>
    );
  }

  if (isAuthenticated && user) {
    return (
      <main className={styles.main}>
        <div className={styles.card}>
          <Trophy size={40} className={styles.heroIcon} />
          <h1 className={styles.title}>
            Fala, <span className={styles.highlight}>{user.nickname}</span>!
          </h1>
          <p className={styles.subtitle}>Pronto pra mais uma partida?</p>

          <div className={styles.actions}>
            <Link href="/game" className={styles.buttonPrimary}>
              <Store size={18} />
              Ir para Loja
            </Link>
            <Link href="/profile" className={styles.buttonPrimary}>
              Meu Perfil
            </Link>
            <button onClick={logout} className={styles.buttonOutline}>
              Sair
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <Trophy size={48} className={styles.heroIcon} />
        <h1 className={styles.title}>AutoSoccer</h1>
        <p className={styles.subtitle}>
          Gerencie suas peladas, monte times equilibrados e acompanhe suas
          estatisticas.
        </p>

        <div className={styles.actions}>
          <Link href="/auth/login" className={styles.buttonPrimary}>
            <LogIn size={18} />
            Entrar
          </Link>
          <Link href="/auth/register" className={styles.buttonOutline}>
            <UserPlus size={18} />
            Criar conta
          </Link>
        </div>
      </div>
    </main>
  );
}
