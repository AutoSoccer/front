export const locales = ["pt-BR", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt-BR";

export const localeCookieName = "NEXT_LOCALE";

export const namespaces = [
  "common",
  "home",
  "auth",
  "profile",
  "game",
  "battle",
  "ranking",
  "errors",
  "validation",
] as const;

export type Namespace = (typeof namespaces)[number];

export function isLocale(value: string | undefined | null): value is Locale {
  if (!value) return false;
  return (locales as readonly string[]).includes(value);
}
