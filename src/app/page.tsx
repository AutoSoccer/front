"use client";

import { LogIn, ShoppingBag, Trophy, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import styles from "./page.module.css";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/game");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return (
      <main className={styles.main}>
        <div className={styles.contentSide}>
          <p className={styles.loadingText}>Carregando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <aside className={styles.heroSide} aria-hidden="true">
        <span className={styles.heroLogo}>⚽</span>
        <span className={styles.heroFooter}>
          AutoSoccer · Monte sua equipe e dispute o campeonato
        </span>
      </aside>

      <section className={styles.contentSide}>
        <div className={styles.card}>
          <div className={styles.brandWrap}>
            <span className={styles.brandMark}>⚽</span>
            <span className={styles.brandTitle}>AutoSoccer</span>
          </div>

          <div className={styles.heading}>
            <h1 className={styles.title}>Bem-vindo ao painel.</h1>
            <p className={styles.subtitle}>
              Compre atletas, monte sua formação e acompanhe sua jornada no
              campeonato.
            </p>
          </div>

          <div className={styles.actions}>
            <Link href="/auth/login" className={styles.buttonPrimary}>
              <LogIn size={18} />
              Acessar Conta
            </Link>
            <Link href="/auth/register" className={styles.buttonOutline}>
              <UserPlus size={18} />
              Criar conta
            </Link>
          </div>

          <div className={styles.featureRow}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>
                <ShoppingBag size={16} />
              </span>
              <span className={styles.featureTitle}>Mercado</span>
              <span className={styles.featureDesc}>
                Atletas únicos a cada rodada para escalar.
              </span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>
                <Users size={16} />
              </span>
              <span className={styles.featureTitle}>Sua Equipe</span>
              <span className={styles.featureDesc}>
                Posicione defesa, centro e ataque.
              </span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>
                <Trophy size={16} />
              </span>
              <span className={styles.featureTitle}>Campeonato</span>
              <span className={styles.featureDesc}>
                Vença rodadas e suba na liga.
              </span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>
                <UserPlus size={16} />
              </span>
              <span className={styles.featureTitle}>Comunidade</span>
              <span className={styles.featureDesc}>
                Junte-se a outros treinadores.
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
