"use client";

import {
  HomeFilled,
  TeamOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import ProfileCorner from "@/components/ProfileCorner";
import { useAuth } from "@/hooks/useAuth";
import { resetGameSession } from "@/lib/gameSession";
import { gameService } from "@/services/gameService";

import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
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
      setStartError("Digite um nome para o seu time.");
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
      const message =
        typeof error === "object" && error !== null && "response" in error
          ? (
              error as {
                response?: { data?: { message?: string } };
              }
            ).response?.data?.message
          : null;
      setStartError(message ?? "Nao foi possivel iniciar a campanha.");
    } finally {
      setIsStartingCampaign(false);
    }
  }

  return (
    <main className={styles.main}>
      <span className={styles.brandFloating} aria-label="AutoSoccer">
        <img src="/logo.png" alt="AutoSoccer" />
      </span>

      {isAuthenticated && <ProfileCorner />}

      {isLoading ? (
        <p className={styles.loadingState}>Carregando...</p>
      ) : (
        <div className={styles.menu}>
          <button
            type="button"
            className={`${styles.menuButton} ${styles.menuButtonHero}`}
            onClick={handlePlayClick}
          >
            Jogar <TrophyFilled />
          </button>
          {/* <Link href="/game" className={styles.menuButton}>
            Atletas
          </Link> */}
          <Link href="/profile" className={styles.menuButton}>
            <TeamOutlined /> Perfil
          </Link>
          <Link href="/ranking" className={styles.menuButton}>
            <ChartNoAxesColumnIncreasing aria-hidden="true" /> Ranking
          </Link>
          {/* <Link href="/game" className={styles.menuButton}>
            Histórico
          </Link> */}

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

      <div className={styles.tipBox}>Você está ótimo hoje!</div>
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
            <h2 id="team-name-title">Escolha o nome do time</h2>
            <label htmlFor="team-name">Nome do time</label>
            <input
              id="team-name"
              name="team-name"
              type="text"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value.slice(0, 40))}
              maxLength={40}
              autoComplete="off"
              autoFocus
              placeholder="Ex.: Canela de Vidro FC"
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
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.modalPrimaryButton}
                disabled={isStartingCampaign || teamName.trim().length === 0}
              >
                {isStartingCampaign ? "Iniciando..." : "Começar campanha"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
