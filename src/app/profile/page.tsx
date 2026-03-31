"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <main className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Meu Perfil</h1>

        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Nome</span>
            <span className={styles.value}>{user.name ?? "Não informado"}</span>
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

        <button className={styles.button} onClick={logout}>
          Sair da conta
        </button>
      </div>
    </main>
  );
}
