"use client";

import {
  HeartFilled,
  HomeFilled,
  LogoutOutlined,
  SafetyCertificateFilled,
  TrophyFilled,
} from "@ant-design/icons";
import { Button } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import ProfileCorner from "@/components/ProfileCorner";
import { useAuth } from "@/hooks/useAuth";

import styles from "./profile.module.css";

function getInitial(value?: string | null): string {
  if (!value) return "U";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : "U";
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <main className={styles.container}>
        <span className={styles.brandFloating} aria-label="AutoSoccer">
          <img src="/logo.png" alt="AutoSoccer" />
        </span>
        <p className={styles.loading}>Carregando perfil...</p>
      </main>
    );
  }

  const displayName = user.name?.trim() || user.nickname;

  return (
    <main className={styles.container}>
      <span className={styles.brandFloating} aria-label="AutoSoccer">
        <img src="/logo.png" alt="AutoSoccer" />
      </span>

      <ProfileCorner />

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <div className={styles.bigAvatar}>{getInitial(displayName)}</div>
          <div className={styles.identity}>
            <h1 className={styles.userName}>{displayName}</h1>
            <p className={styles.userNick}>@{user.nickname}</p>
            <div className={styles.tagsRow}>
              <span className={styles.tag}>Treinador</span>
              <span className={styles.tag}>Liga Inicial</span>
            </div>
          </div>
        </header>

        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Nome</span>
            <span className={styles.infoValue}>
              {user.name ?? "Não informado"}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Apelido</span>
            <span className={styles.infoValue}>{user.nickname}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>E-mail</span>
            <span className={styles.infoValue}>{user.email}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Telefone</span>
            <span className={styles.infoValue}>
              {user.phone_number ?? "Não informado"}
            </span>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <TrophyFilled style={{ fontSize: 20, color: "var(--brand-active)" }} />
            <span className={styles.statValue}>0</span>
            <span className={styles.statLabel}>Vitórias</span>
          </div>
          <div className={styles.statBox}>
            <HeartFilled style={{ fontSize: 20, color: "var(--brand-active)" }} />
            <span className={styles.statValue}>0</span>
            <span className={styles.statLabel}>Derrotas</span>
          </div>
          <div className={styles.statBox}>
            <SafetyCertificateFilled
              style={{ fontSize: 20, color: "var(--brand-active)" }}
            />
            <span className={styles.statValue}>0</span>
            <span className={styles.statLabel}>Troféus</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="/" style={{ flex: 1 }}>
            <Button
              type="default"
              size="large"
              icon={<HomeFilled />}
              block
              style={{
                height: 48,
                fontWeight: 700,
                border: "3px solid #1f2937",
                boxShadow: "0 4px 0 rgba(0,0,0,0.2)",
              }}
            >
              Voltar ao Menu
            </Button>
          </Link>
          <Button
            type="primary"
            size="large"
            danger
            icon={<LogoutOutlined />}
            onClick={logout}
            style={{
              height: 48,
              flex: 1,
              fontWeight: 700,
              border: "3px solid #1f2937",
              boxShadow: "0 4px 0 #7f1d1d",
            }}
          >
            Sair da conta
          </Button>
        </div>
      </section>
    </main>
  );
}
