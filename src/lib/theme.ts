export const themeCookieName = "NEXT_THEME";

export const themes = ["light", "dark"] as const;

export type Theme = (typeof themes)[number];

export const defaultTheme: Theme = "light";

export function isTheme(value: string | undefined | null): value is Theme {
  if (!value) return false;
  return (themes as readonly string[]).includes(value);
}

export function nextTheme(current: Theme): Theme {
  return current === "light" ? "dark" : "light";
}
