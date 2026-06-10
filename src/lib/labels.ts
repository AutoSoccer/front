import { useTranslations } from "next-intl";

export type RoleKey = "goalkeeper" | "defender" | "midfielder" | "attacker";
export type AreaKey = "defense" | "midfield" | "attack";

/**
 * Labels traduzidos para posicoes de atleta.
 * Usa o namespace common.roles.
 */
export function useRoleLabels(): Record<RoleKey, string> {
  const t = useTranslations("common.roles");
  return {
    goalkeeper: t("goalkeeper"),
    defender: t("defender"),
    midfielder: t("midfielder"),
    attacker: t("attacker"),
  };
}

/**
 * Labels traduzidos para areas do campo (Defesa/Centro/Ataque).
 * Usa o namespace common.areas.
 */
export function useAreaLabels(): string[] {
  const t = useTranslations("common.areas");
  return [t("defense"), t("midfield"), t("attack")];
}
