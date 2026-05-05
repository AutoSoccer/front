"use client";

import { Heart, ShieldCheck, Trophy } from "lucide-react";

import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/hooks/useAuth";

import styles from "./profile.module.css";

function getInitial(value?: string | null): string {
  if (!value) return "U";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : "U";
}

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <DashboardShell>
      <header className={styles.header}>
        <h1 className={styles.title}>Meu Perfil</h1>
        <p className={styles.subtitle}>
          Visualize e gerencie seus dados de treinador.
        </p>
      </header>

      {!user ? (
        <p className={styles.loading}>Carregando dados do usuario...</p>
      ) : (
        <div className={styles.grid}>
          <aside className={styles.identityCard}>
            <div className={styles.bigAvatar}>{getInitial(user.name ?? user.nickname)}</div>
            <p className={styles.userName}>{user.name ?? user.nickname}</p>
            <p className={styles.userNick}>@{user.nickname}</p>

            <div className={styles.tagsRow}>
              <span className={styles.tag}>Treinador</span>
              <span className={`${styles.tag} ${styles.tagYellow}`}>
                Liga Inicial
              </span>
              <span className={`${styles.tag} ${styles.tagBlue}`}>
                Brasil
              </span>
            </div>

            <button
              type="button"
              className={styles.logoutButton}
              onClick={logout}
            >
              Sair da conta
            </button>
          </aside>

          <section className={styles.detailsCard}>
            <h2 className={styles.detailsTitle}>Dados pessoais</h2>

            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Nome</span>
                <span className={styles.value}>
                  {user.name ?? "Não informado"}
                </span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.label}>Apelido</span>
                <span className={styles.value}>{user.nickname}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.label}>E-mail</span>
                <span className={styles.value}>{user.email}</span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.label}>Telefone</span>
                <span className={styles.value}>
                  {user.phone_number ?? "Não informado"}
                </span>
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <span className={styles.statIcon}>
                  <Trophy size={16} />
                </span>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>Vitórias</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statIcon}>
                  <Heart size={16} />
                </span>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>Derrotas</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statIcon}>
                  <ShieldCheck size={16} />
                </span>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>Troféus</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
