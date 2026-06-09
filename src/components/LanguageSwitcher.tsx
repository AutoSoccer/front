"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import type { Locale } from "@/i18n/config";
import { localeCookieName, locales } from "@/i18n/config";

import styles from "./LanguageSwitcher.module.css";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function nextLocale(current: string): Locale {
  const list = locales as readonly Locale[];
  const index = list.indexOf(current as Locale);
  if (index === -1) {
    return list[0];
  }
  return list[(index + 1) % list.length];
}

function persistLocale(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

export default function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const target = nextLocale(locale);
  const label = target === "en" ? t("language.english") : t("language.portuguese");
  const flag = target === "en" ? "EN" : "PT";

  function handleClick() {
    persistLocale(target);
    startTransition(() => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    });
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      disabled={isPending}
      aria-label={`${t("language.label")}: ${label}`}
    >
      <span className={styles.flag} aria-hidden="true">
        {flag}
      </span>
      {label}
    </button>
  );
}
