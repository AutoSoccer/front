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
import { useTranslations } from "next-intl";
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
import { getErrorMessage } from "@/lib/errors";
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
  const t = useTranslations("ranking.user");

  if (currentUser.isGuest) {
    return (
      <div className={styles.metricsEmpty}>
        <div className={styles.emptyIcon}>
          <LogIn aria-hidden="true" />
        </div>
        <h2>{t("guestTitle")}</h2>
        <p>{t("guestDescription")}</p>
        <button
          type="button"
          className={styles.loginButton}
          onClick={() => router.push("/auth/login")}
        >
          <LogIn aria-hidden="true" />
          {t("guestLogin")}
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
        <h2>{t("noCampaign")}</h2>
        <p>{t("noCampaignDescription")}</p>
        <Link href="/" className={styles.playButton}>
          <Trophy aria-hidden="true" />
          {t("startCampaign")}
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
          <span className={styles.eyebrow}>{t("yourPerformance")}</span>
          <h2>@{currentUser.nickname}</h2>
        </div>
        <span className={styles.currentPosition}>
          {currentUser.position
            ? positionLabel(currentUser.position)
            : t("noPosition")}
        </span>
      </header>

      <div className={styles.chartArea}>
        <div
          className={styles.donutChart}
          style={chartStyle}
          role="img"
          aria-label={t("winRateAria", {
            winRate: currentUser.winRate,
            lossRate: currentUser.lossRate,
          })}
        >
          <div className={styles.chartCenter}>
            <strong>{currentUser.winRate}%</strong>
            <span>{t("winRateLabel")}</span>
          </div>
        </div>

        <div className={styles.chartLegend}>
          <div className={styles.legendRow}>
            <span className={`${styles.legendDot} ${styles.winDot}`} />
            <span>{t("victoriesLegend")}</span>
            <strong>{currentUser.winRate}%</strong>
          </div>
          <div className={styles.legendRow}>
            <span className={`${styles.legendDot} ${styles.lossDot}`} />
            <span>{t("defeatsLegend")}</span>
            <strong>{currentUser.lossRate}%</strong>
          </div>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <Trophy aria-hidden="true" />
          <strong>{currentUser.trophies}</strong>
          <span>{t("trophies")}</span>
        </div>
        <div className={styles.metricItem}>
          <ShieldCheck aria-hidden="true" />
          <strong>{currentUser.victory}</strong>
          <span>{t("victories")}</span>
        </div>
        <div className={styles.metricItem}>
          <Target aria-hidden="true" />
          <strong>{currentUser.defeat}</strong>
          <span>{t("defeats")}</span>
        </div>
      </div>

      <p className={styles.campaignTotal}>
        {t("completedCampaigns", { count: currentUser.completedCampaigns })}
      </p>
    </div>
  );
}

export default function RankingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const t = useTranslations("ranking");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const [data, setData] = useState<RankingResponse | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const retryRanking = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    try {
      setData(await rankingService.getRanking(50));
    } catch (err) {
      setError(getErrorMessage(err, tErrors) || t("error"));
    } finally {
      setIsFetching(false);
    }
  }, [t, tErrors]);

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
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, tErrors) || t("error"));
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
  }, [isAuthenticated, isLoading, router, t, tErrors]);

  if (isLoading || (!isAuthenticated && !error)) {
    return (
      <main className={styles.page}>
        <p className={styles.pageLoading}>{t("loading")}</p>
      </main>
    );
  }

  const topThree = data?.ranking.slice(0, 3) ?? [];
  const currentUserId = data?.currentUser.userId;

  return (
    <main className={styles.page}>
      <span className={styles.brandFloating} aria-label={tCommon("appName")}>
        <img src="/logo.png" alt={tCommon("appName")} />
      </span>

      <ProfileCorner />

      <section className={styles.rankingSurface}>
        <header className={styles.pageHeader}>
          <Link
            href="/"
            className={styles.homeButton}
            aria-label={t("header.backHomeAria")}
          >
            <Home aria-hidden="true" />
          </Link>
          <div className={styles.titleGroup}>
            <span className={styles.eyebrow}>{t("header.season")}</span>
            <h1>{t("title")}</h1>
            <p>{t("header.subtitle")}</p>
          </div>
          <div className={styles.headerTrophy} aria-hidden="true">
            <Trophy />
          </div>
        </header>

        {isFetching ? (
          <div className={styles.loadingPanel}>
            <span className={styles.loadingBall} />
            <strong>{t("loadingPanel")}</strong>
          </div>
        ) : error ? (
          <div className={styles.errorPanel} role="alert">
            <Target aria-hidden="true" />
            <strong>{error}</strong>
            <button type="button" onClick={() => void retryRanking()}>
              <RefreshCw aria-hidden="true" />
              {t("retry")}
            </button>
          </div>
        ) : data ? (
          <>
            {topThree.length > 0 && (
              <div className={styles.podium} aria-label={t("podium.aria")}>
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
                    <span className={styles.eyebrow}>{t("list.label")}</span>
                    <h2>{t("list.top")}</h2>
                  </div>
                  <span>
                    {t("list.playersCount", { count: data.ranking.length })}
                  </span>
                </header>

                {data.ranking.length === 0 ? (
                  <div className={styles.emptyRanking}>
                    <Trophy aria-hidden="true" />
                    <strong>{t("emptyPodium.title")}</strong>
                    <span>{t("emptyPodium.description")}</span>
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
                            <small>{t("list.you")}</small>
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
                        <small>{t("list.you")}</small>
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
