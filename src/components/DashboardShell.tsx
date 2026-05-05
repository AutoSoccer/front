"use client";

import {
  ChevronLeft,
  ChevronRight,
  Info,
  LogOut,
  Moon,
  ShoppingBag,
  User as UserIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";
import styles from "./DashboardShell.module.css";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

type NavGroup = {
  heading: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    heading: "Arena AutoSoccer",
    items: [
      { label: "Mercado", href: "/game", icon: <ShoppingBag size={18} /> },
      { label: "Minha Equipe", href: "/team", icon: <Users size={18} /> },
    ],
  },
  {
    heading: "Configurações",
    items: [
      { label: "Perfil", href: "/profile", icon: <UserIcon size={18} /> },
      { label: "Informações", href: "/info", icon: <Info size={18} /> },
    ],
  },
];

function getInitial(value?: string | null): string {
  if (!value) return "U";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : "U";
}

export type DashboardShellProps = {
  children: ReactNode;
  requireAuth?: boolean;
};

export default function DashboardShell({
  children,
  requireAuth = true,
}: DashboardShellProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (requireAuth && !isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [requireAuth, isLoading, isAuthenticated, router]);

  if (requireAuth && (isLoading || !isAuthenticated)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          color: "var(--text-muted)",
        }}
      >
        Carregando...
      </div>
    );
  }

  const displayName = user?.name?.trim() || user?.nickname || "Convidado";

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Navegação principal">
        <div className={styles.brandRow}>
          <Link href="/game" className={styles.brand} aria-label="AutoSoccer">
            <span className={styles.brandMark} aria-hidden="true">
              ⚽
            </span>
            <span className={styles.brandText}>
              <span className={styles.brandTitle}>AutoSoccer</span>
              <span className={styles.brandSub}>Painel</span>
            </span>
          </Link>
          <div className={styles.navArrows}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Voltar"
              onClick={() => router.back()}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Avançar"
              onClick={() => router.forward()}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {navGroups.map((group) => (
          <div key={group.heading} className={styles.navSection}>
            <p className={styles.navHeading}>{group.heading}</p>
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${
                    isActive ? styles.navItemActive : ""
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.topbarToggle}
            aria-label="Alternar tema"
            title="Alternar tema (em breve)"
          >
            <Moon size={16} />
          </button>

          <div className={styles.userBadge}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userRole}>
                {user?.email ?? "convidado@autosoccer"}
              </span>
            </div>
            <div className={styles.avatar} aria-hidden="true">
              {getInitial(displayName)}
              <span className={styles.avatarStatus} />
            </div>
          </div>

          <button
            type="button"
            className={styles.logoutButton}
            onClick={logout}
            aria-label="Sair"
          >
            <LogOut size={14} />
            Sair
          </button>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
