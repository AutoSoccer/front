"use client";

import {
  HomeFilled,
  TeamOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import ProfileCorner from "@/components/ProfileCorner";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import { resetGameSession } from "@/lib/gameSession";
import { gameService } from "@/services/gameService";

import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [isStartingCampaign, setIsStartingCampaign] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  function handlePlayClick() {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    setTeamName("");
    setStartError(null);
    setIsTeamModalOpen(true);
  }

  async function handleStartCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = teamName.trim();

    if (!normalizedName) {
      setStartError(t("modal.validation"));
      return;
    }

    setIsStartingCampaign(true);
    setStartError(null);

    try {
      await gameService.startCampaign(normalizedName);
      resetGameSession();
      setIsTeamModalOpen(false);
      router.push("/game");
    } catch (error) {
      setStartError(getErrorMessage(error, tErrors) || t("modal.errorGeneric"));
    } finally {
      setIsStartingCampaign(false);
    }
  }

  return (
    <main className={styles.main}>
      <span className={styles.brandFloating} aria-label={tCommon("appName")}>
        <img src="/logo.png" alt={tCommon("appName")} />
      </span>

      {isAuthenticated && <ProfileCorner />}

      {isLoading ? (
        <p className={styles.loadingState}>{tCommon("loading")}</p>
      ) : (
        <div className={styles.menu}>
          <button
            type="button"
            className={`${styles.menuButton} ${styles.menuButtonHero}`}
            onClick={handlePlayClick}
          >
            {t("actions.play")} <TrophyFilled />
          </button>
          <Link href="/profile" className={styles.menuButton}>
            <TeamOutlined /> {t("actions.profile")}
          </Link>
          <Link href="/ranking" className={styles.menuButton}>
            <ChartNoAxesColumnIncreasing aria-hidden="true" /> {t("actions.ranking")}
          </Link>

          {!isAuthenticated && (
            <p className={styles.guestNotice}>
              {t("guest.notice")}{" "}
              <Link href="/auth/login" className={styles.guestLink}>
                {t("guest.signIn")}
              </Link>{" "}
              {t("guest.or")}{" "}
              <Link href="/auth/register" className={styles.guestLink}>
                {t("guest.createAccount")}
              </Link>{" "}
              {t("guest.saveProgress")}
            </p>
          )}
        </div>
      )}

      <div className={styles.menuFooter}>
        <Link
          href="/"
          className={styles.footerButton}
          aria-label={tCommon("menu.home")}
        >
          <HomeFilled />
        </Link>
      </div>

      <div className={styles.tipBox}>{t("tip")}</div>
      {isTeamModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <form
            className={styles.teamModal}
            onSubmit={(event) => void handleStartCampaign(event)}
            aria-labelledby="team-name-title"
          >
            <span className={styles.teamModalIcon} aria-hidden="true">
              <TeamOutlined />
            </span>
            <h2 id="team-name-title">{t("modal.title")}</h2>
            <label htmlFor="team-name">{t("modal.label")}</label>
            <input
              id="team-name"
              name="team-name"
              type="text"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value.slice(0, 40))}
              maxLength={40}
              autoComplete="off"
              autoFocus
              placeholder={t("modal.placeholder")}
              disabled={isStartingCampaign}
            />
            <span className={styles.characterCount}>{teamName.length}/40</span>
            {startError && (
              <p className={styles.modalError} role="alert">
                {startError}
              </p>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalSecondaryButton}
                onClick={() => setIsTeamModalOpen(false)}
                disabled={isStartingCampaign}
              >
                {t("modal.cancel")}
              </button>
              <button
                type="submit"
                className={styles.modalPrimaryButton}
                disabled={isStartingCampaign || teamName.trim().length === 0}
              >
                {isStartingCampaign
                  ? t("modal.submitting")
                  : t("modal.submit")}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
