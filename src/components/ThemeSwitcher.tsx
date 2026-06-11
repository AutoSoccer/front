"use client";

import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  defaultTheme,
  isTheme,
  nextTheme,
  themeCookieName,
  type Theme,
} from "@/lib/theme";

import styles from "./ThemeSwitcher.module.css";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function readThemeCookie(): Theme {
  if (typeof document === "undefined") return defaultTheme;
  const cookies = document.cookie.split(";");
  for (const raw of cookies) {
    const [key, value] = raw.trim().split("=");
    if (key === themeCookieName && isTheme(value)) {
      return value;
    }
  }
  return defaultTheme;
}

function persistTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.cookie = `${themeCookieName}=${theme}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export type ThemeSwitcherProps = {
  initialTheme?: Theme;
};

export default function ThemeSwitcher({ initialTheme }: ThemeSwitcherProps) {
  const t = useTranslations("common.theme");
  const [theme, setTheme] = useState<Theme>(initialTheme ?? defaultTheme);

  useEffect(() => {
    const stored = readThemeCookie();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const target = nextTheme(theme);
  const label = target === "dark" ? t("dark") : t("light");

  function handleClick() {
    const next = nextTheme(theme);
    setTheme(next);
    persistTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      aria-label={`${t("label")}: ${label}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {target === "dark" ? <MoonOutlined /> : <SunOutlined />}
      </span>
      {label}
    </button>
  );
}
