"use client";

import {
  HeartFilled,
  HomeFilled,
  LogoutOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateFilled,
  TrophyFilled,
  UserOutlined,
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

function formatPhone(value: string | null): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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

      {/* RF002: perfil somente leitura — o backend expoe os dados via /auth/me. */}
      <div className={styles.card}>
        <header className={styles.cardHeader}>
          <div className={styles.bigAvatar}>{getInitial(displayName)}</div>
          <div className={styles.identity}>
            <h1 className={styles.userName}>{displayName}</h1>
            <p className={styles.userNick}>@{user.nickname}</p>
            <div className={styles.tagsRow}>
              <span className={styles.tag}>
                {user.is_guest ? "Convidado" : "Treinador"}
              </span>
              <span className={styles.tag}>Liga Inicial</span>
            </div>
          </div>
        </header>

        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <label className={styles.infoLabel}>Nome</label>
            <div className={styles.inputWrap}>
              <UserOutlined className={styles.inputIcon} />
              <input
                className={styles.input}
                value={user.name ?? ""}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className={styles.infoItem}>
            <label className={styles.infoLabel}>Apelido</label>
            <div className={styles.inputWrap}>
              <LockOutlined className={styles.inputIcon} />
              <input
                className={styles.input}
                value={user.nickname}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className={styles.infoItem}>
            <label className={styles.infoLabel}>E-mail</label>
            <div className={styles.inputWrap}>
              <MailOutlined className={styles.inputIcon} />
              <input
                className={styles.input}
                value={user.email}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className={styles.infoItem}>
            <label className={styles.infoLabel}>Telefone</label>
            <div className={styles.inputWrap}>
              <PhoneOutlined className={styles.inputIcon} />
              <input
                className={styles.input}
                value={formatPhone(user.phone_number)}
                readOnly
                disabled
              />
            </div>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <TrophyFilled style={{ fontSize: 20, color: "var(--brand-active)" }} />
            <span className={styles.statValue}>{user.victory ?? 0}</span>
            <span className={styles.statLabel}>Vitórias</span>
          </div>
          <div className={styles.statBox}>
            <HeartFilled style={{ fontSize: 20, color: "var(--brand-active)" }} />
            <span className={styles.statValue}>{user.defeat ?? 0}</span>
            <span className={styles.statLabel}>Derrotas</span>
          </div>
          <div className={styles.statBox}>
            <SafetyCertificateFilled
              style={{ fontSize: 20, color: "var(--brand-active)" }}
            />
            <span className={styles.statValue}>{user.trophies ?? 0}</span>
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
      </div>
    </main>
  );
}
