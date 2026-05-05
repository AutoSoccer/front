"use client";

import {
  HeartFilled,
  HomeFilled,
  LockOutlined,
  LogoutOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateFilled,
  SaveOutlined,
  TrophyFilled,
  UserOutlined,
} from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import ProfileCorner from "@/components/ProfileCorner";
import { useAuth } from "@/hooks/useAuth";
import {
  profileSchema,
  type ProfileFormInputs,
} from "@/lib/schemas/auth";

import styles from "./profile.module.css";

function getInitial(value?: string | null): string {
  if (!value) return "U";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : "U";
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [feedback, setFeedback] = useState<
    { tone: "success" | "error"; message: string } | null
  >(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormInputs>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? "",
      nickname: user?.nickname ?? "",
      email: user?.email ?? "",
      phone_number: user?.phone_number ?? "",
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const onSubmit = async (data: ProfileFormInputs) => {
    setFeedback(null);
    try {
      // TODO: integrar com endpoint de atualizacao de perfil quando existir
      console.info("Atualizar perfil:", data);
      reset(data);
      setFeedback({
        tone: "success",
        message: "Dados validados! Salvamento será integrado em breve.",
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Não foi possível salvar as alterações.",
      });
    }
  };

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

      <form className={styles.card} onSubmit={handleSubmit(onSubmit)}>
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
            <label className={styles.infoLabel} htmlFor="profile-name">
              Nome
            </label>
            <div className={styles.inputWrap}>
              <UserOutlined className={styles.inputIcon} />
              <input
                id="profile-name"
                className={styles.input}
                placeholder="Seu nome"
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className={styles.errorText}>{errors.name.message}</p>
            )}
          </div>

          <div className={styles.infoItem}>
            <label className={styles.infoLabel} htmlFor="profile-nickname">
              Apelido
            </label>
            <div className={styles.inputWrap}>
              <LockOutlined className={styles.inputIcon} />
              <input
                id="profile-nickname"
                className={styles.input}
                placeholder="Seu apelido"
                {...register("nickname")}
              />
            </div>
            {errors.nickname && (
              <p className={styles.errorText}>{errors.nickname.message}</p>
            )}
          </div>

          <div className={styles.infoItem}>
            <label className={styles.infoLabel} htmlFor="profile-email">
              E-mail
            </label>
            <div className={styles.inputWrap}>
              <MailOutlined className={styles.inputIcon} />
              <input
                id="profile-email"
                type="email"
                className={styles.input}
                placeholder="seu@email.com"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className={styles.errorText}>{errors.email.message}</p>
            )}
          </div>

          <div className={styles.infoItem}>
            <label className={styles.infoLabel} htmlFor="profile-phone">
              Telefone
            </label>
            <div className={styles.inputWrap}>
              <PhoneOutlined className={styles.inputIcon} />
              <input
                id="profile-phone"
                type="tel"
                inputMode="numeric"
                maxLength={15}
                className={styles.input}
                placeholder="(00) 00000-0000"
                {...register("phone_number", {
                  onChange: (event) => {
                    event.target.value = formatPhone(event.target.value);
                  },
                })}
              />
            </div>
            {errors.phone_number && (
              <p className={styles.errorText}>{errors.phone_number.message}</p>
            )}
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

        {feedback && (
          <p className={styles.feedback} data-tone={feedback.tone} role="status">
            {feedback.message}
          </p>
        )}

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
            htmlType="submit"
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={isSubmitting}
            disabled={!isDirty}
            style={{
              height: 48,
              flex: 1,
              fontWeight: 700,
              border: "3px solid #1f2937",
              boxShadow: "0 4px 0 #b45309",
            }}
          >
            Salvar
          </Button>
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
      </form>
    </main>
  );
}
