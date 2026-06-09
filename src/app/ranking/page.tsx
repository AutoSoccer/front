"use client";

import {
  Crown,
  Home,
  LogIn,
  Medal,
  RefreshCw,
  ShieldCheck,
  Target,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useState,
} from "react";

import ProfileCorner from "@/components/ProfileCorner";
import { useAuth } from "@/hooks/useAuth";
import {
  type RankingEntry,
  type RankingResponse,
  rankingService,
} from "@/services/rankingService";

import styles from "./ranking.module.css";

const podiumOrder = [1, 0, 2];

function positionLabel(position: number): string {
  return `${position}º`;
}

function medalTone(position: number): string {
  if (position === 1) return styles.gold;
  if (position === 2) return styles.silver;
  if (position === 3) return styles.bronze;
  return "";
}

function PodiumPlayer({
  entry,
  isCurrentUser,
}: {
  entry: RankingEntry;
  isCurrentUser: boolean;
}) {
  return (
    <article
      className={`${styles.podiumPlayer} ${styles[`podiumPosition${entry.position}`]} ${medalTone(entry.position)}`}
      data-current={isCurrentUser}
    >
      <div className={styles.podiumIcon} aria-hidden="true">
        {entry.position === 1 ? <Crown /> : <Medal />}
      </div>
      <strong className={styles.podiumNickname}>@{entry.nickname}</strong>
      <span className={styles.podiumTrophies}>
        <Trophy aria-hidden="true" />
        {entry.trophies}
      </span>
      <span className={styles.podiumPlace}>{positionLabel(entry.position)}</span>
    </article>
  );
}

function CurrentUserMetrics({
  currentUser,
}: {
  currentUser: RankingResponse["currentUser"];
}) {
  const router = useRouter();

  if (currentUser.isGuest) {
    return (
      <div className={styles.metricsEmpty}>
        <div className={styles.emptyIcon}>
          <LogIn aria-hidden="true" />
        </div>
        <h2>Entre para ver suas métricas</h2>
        <p>
          Convidados podem acompanhar o ranking, mas apenas contas registradas
          guardam campanhas e troféus.
        </p>
        <button
          type="button"
          className={styles.loginButton}
          onClick={() => router.push("/auth/login")}
        >
          <LogIn aria-hidden="true" />
          Entrar
        </button>
      </div>
    );
  }

  if (currentUser.completedCampaigns === 0) {
    return (
      <div className={styles.metricsEmpty}>
        <div className={styles.emptyIcon}>
          <Target aria-hidden="true" />
        </div>
        <h2>Nenhuma campanha concluída</h2>
        <p>
          Finalize sua primeira campanha para liberar aproveitamento, posição e
          histórico competitivo.
        </p>
        <Link href="/" className={styles.playButton}>
          <Trophy aria-hidden="true" />
          Começar campanha
        </Link>
      </div>
    );
  }

  const chartStyle = {
    "--win-rate": `${currentUser.winRate}%`,
  } as CSSProperties;

  return (
    <div className={styles.metricsContent}>
      <header className={styles.metricsHeader}>
        <div>
          <span className={styles.eyebrow}>Seu desempenho</span>
          <h2>@{currentUser.nickname}</h2>
        </div>
        <span className={styles.currentPosition}>
          {currentUser.position
            ? positionLabel(currentUser.position)
            : "Sem posição"}
        </span>
      </header>

      <div className={styles.chartArea}>
        <div
          className={styles.donutChart}
          style={chartStyle}
          role="img"
          aria-label={`${currentUser.winRate}% de vitórias e ${currentUser.lossRate}% de derrotas`}
        >
          <div className={styles.chartCenter}>
            <strong>{currentUser.winRate}%</strong>
            <span>vitórias</span>
          </div>
        </div>

        <div className={styles.chartLegend}>
          <div className={styles.legendRow}>
            <span className={`${styles.legendDot} ${styles.winDot}`} />
            <span>Vitórias</span>
            <strong>{currentUser.winRate}%</strong>
          </div>
          <div className={styles.legendRow}>
            <span className={`${styles.legendDot} ${styles.lossDot}`} />
            <span>Derrotas</span>
            <strong>{currentUser.lossRate}%</strong>
          </div>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <Trophy aria-hidden="true" />
          <strong>{currentUser.trophies}</strong>
          <span>Troféus</span>
        </div>
        <div className={styles.metricItem}>
          <ShieldCheck aria-hidden="true" />
          <strong>{currentUser.victory}</strong>
          <span>Vitórias</span>
        </div>
        <div className={styles.metricItem}>
          <Target aria-hidden="true" />
          <strong>{currentUser.defeat}</strong>
          <span>Derrotas</span>
        </div>
      </div>

      <p className={styles.campaignTotal}>
        {currentUser.completedCampaigns} campanhas concluídas
      </p>
    </div>
  );
}

export default function RankingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [data, setData] = useState<RankingResponse | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const retryRanking = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    try {
      setData(await rankingService.getRanking(50));
    } catch {
      setError("Não foi possível carregar o ranking agora.");
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    let cancelled = false;

    rankingService
      .getRanking(50)
      .then((response) => {
        if (!cancelled) {
          setData(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Não foi possível carregar o ranking agora.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || (!isAuthenticated && !error)) {
    return (
      <main className={styles.page}>
        <p className={styles.pageLoading}>Carregando ranking...</p>
      </main>
    );
  }

  const topThree = data?.ranking.slice(0, 3) ?? [];
  const currentUserId = data?.currentUser.userId;

  return (
    <main className={styles.page}>
      <span className={styles.brandFloating} aria-label="AutoSoccer">
        <img src="/logo.png" alt="AutoSoccer" />
      </span>

      <ProfileCorner />

      <section className={styles.rankingSurface}>
        <header className={styles.pageHeader}>
          <Link href="/" className={styles.homeButton} aria-label="Voltar ao menu">
            <Home aria-hidden="true" />
          </Link>
          <div className={styles.titleGroup}>
            <span className={styles.eyebrow}>Temporada geral</span>
            <h1>Ranking</h1>
            <p>Os maiores colecionadores de troféus do AutoSoccer.</p>
          </div>
          <div className={styles.headerTrophy} aria-hidden="true">
            <Trophy />
          </div>
        </header>

        {isFetching ? (
          <div className={styles.loadingPanel}>
            <span className={styles.loadingBall} />
            <strong>Atualizando classificação...</strong>
          </div>
        ) : error ? (
          <div className={styles.errorPanel} role="alert">
            <Target aria-hidden="true" />
            <strong>{error}</strong>
            <button type="button" onClick={() => void retryRanking()}>
              <RefreshCw aria-hidden="true" />
              Tentar novamente
            </button>
          </div>
        ) : data ? (
          <>
            {topThree.length > 0 && (
              <div className={styles.podium} aria-label="Pódio do ranking">
                {podiumOrder.map((entryIndex) => {
                  const entry = topThree[entryIndex];
                  return entry ? (
                    <PodiumPlayer
                      key={entry.userId}
                      entry={entry}
                      isCurrentUser={entry.userId === currentUserId}
                    />
                  ) : null;
                })}
              </div>
            )}

            <div className={styles.contentGrid}>
              <section className={styles.listSection}>
                <header className={styles.sectionHeader}>
                  <div>
                    <span className={styles.eyebrow}>Classificação geral</span>
                    <h2>Top 50</h2>
                  </div>
                  <span>{data.ranking.length} jogadores</span>
                </header>

                {data.ranking.length === 0 ? (
                  <div className={styles.emptyRanking}>
                    <Trophy aria-hidden="true" />
                    <strong>O pódio ainda está vazio</strong>
                    <span>
                      O primeiro jogador a concluir uma campanha inaugura o
                      ranking.
                    </span>
                  </div>
                ) : (
                  <ol className={styles.rankingList}>
                    {data.ranking.map((entry) => (
                      <li
                        key={entry.userId}
                        className={styles.rankingRow}
                        data-current={entry.userId === currentUserId}
                      >
                        <span
                          className={`${styles.listPosition} ${medalTone(entry.position)}`}
                        >
                          {entry.position <= 3 ? (
                            <Medal aria-hidden="true" />
                          ) : (
                            positionLabel(entry.position)
                          )}
                        </span>
                        <span className={styles.listNickname}>
                          @{entry.nickname}
                          {entry.userId === currentUserId && (
                            <small>Você</small>
                          )}
                        </span>
                        <span className={styles.listTrophies}>
                          <Trophy aria-hidden="true" />
                          <strong>{entry.trophies}</strong>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                {!data.currentUser.isGuest &&
                  data.currentUser.position !== null &&
                  !data.currentUser.appearsInRanking && (
                    <div className={styles.outsidePosition}>
                      <span className={styles.listPosition}>
                        {positionLabel(data.currentUser.position)}
                      </span>
                      <span className={styles.listNickname}>
                        @{data.currentUser.nickname}
                        <small>Você</small>
                      </span>
                      <span className={styles.listTrophies}>
                        <Trophy aria-hidden="true" />
                        <strong>{data.currentUser.trophies}</strong>
                      </span>
                    </div>
                  )}
              </section>

              <aside className={styles.metricsSection}>
                <CurrentUserMetrics currentUser={data.currentUser} />
              </aside>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
