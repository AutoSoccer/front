"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  defaultTheme,
  isTheme,
  nextTheme,
  themeCookieName,
  type Theme,
} from "@/lib/theme";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// Le o cookie no momento de inicializacao do estado. Como o componente e
// `"use client"`, esta funcao so e chamada no browser; no SSR/RSC o React
// ja usa o `initialTheme` passado pelo layout (lido server-side via cookies).
function readClientCookie(): Theme | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const raw of cookies) {
    const [key, value] = raw.trim().split("=");
    if (key === themeCookieName && isTheme(value)) {
      return value;
    }
  }
  return null;
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
  // Lazy initializer: prioriza cookie do browser, cai no `initialTheme` SSR,
  // e por ultimo no default. Evita setState dentro de useEffect e o aviso
  // `react-hooks/set-state-in-effect` que vinha quando sincronizavamos em
  // dois passos.
  const [theme, setTheme] = useState<Theme>(
    () => readClientCookie() ?? initialTheme ?? defaultTheme,
  );

  const target = nextTheme(theme);
  const label = target === "dark" ? t("dark") : t("light");

  function handleClick() {
    const next = nextTheme(theme);
    setTheme(next);
    persistTheme(next);
    applyTheme(next);
  }

  return (
    // <button
    //   type="button"
    //   className={styles.button}
    //   onClick={handleClick}
    //   aria-label={`${t("label")}: ${label}`}
    // >
    //   <span className={styles.icon} aria-hidden="true">
    //     {target === "dark" ? <MoonOutlined /> : <SunOutlined />}
    //   </span>
    //   {label}
    // </button>
    <></>
  );
}
