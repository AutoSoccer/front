"use client";

import { LogoutOutlined, ShopOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";

import LanguageSwitcher from "./LanguageSwitcher";
import styles from "./ProfileCorner.module.css";
import ThemeSwitcher from "./ThemeSwitcher";

function getInitial(value?: string | null): string {
  if (!value) return "U";
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : "U";
}

export type ProfileCornerProps = {
  coins?: number;
};

export default function ProfileCorner(_props: ProfileCornerProps) {
  const { user, logout } = useAuth();
  const t = useTranslations("common.menu");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!user) {
    return null;
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <ThemeSwitcher />
      <LanguageSwitcher />
      {/* {typeof coins === "number" && (
        <span className={styles.coinPill} aria-label={`Saldo: ${coins} moedas`}>
          <span className={styles.coinIcon}>
            <DollarOutlined />
          </span>
          {coins}
        </span>
      )} */}

      <button
        type="button"
        className={styles.avatarButton}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("openProfileMenu")}
      >
        {getInitial(user.name ?? user.nickname)}
        <span className={styles.avatarStatus} aria-hidden="true" />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <Link
            href="/profile"
            className={styles.menuItem}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <UserOutlined />
            {t("profile")}
          </Link>
          <Link
            href="/game"
            className={styles.menuItem}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <ShopOutlined />
            {t("market")}
          </Link>
          <span className={styles.menuDivider} aria-hidden="true" />
          <button
            type="button"
            className={`${styles.menuItem} ${styles.menuLogout}`}
            onClick={() => {
              setOpen(false);
              logout();
            }}
            role="menuitem"
          >
            <LogoutOutlined />
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}
