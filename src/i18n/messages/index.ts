import type { Locale, Namespace } from "@/i18n/config";
import { defaultLocale, namespaces } from "@/i18n/config";

type MessageRecord = Record<string, unknown>;

type LocaleMessages = Record<Namespace, MessageRecord>;

const loaders: Record<
  Locale,
  Record<Namespace, () => Promise<MessageRecord>>
> = {
  "pt-BR": {
    common: () =>
      import("./pt-BR/common.json").then((module) => module.default),
    home: () => import("./pt-BR/home.json").then((module) => module.default),
    auth: () => import("./pt-BR/auth.json").then((module) => module.default),
    profile: () =>
      import("./pt-BR/profile.json").then((module) => module.default),
    game: () => import("./pt-BR/game.json").then((module) => module.default),
    battle: () =>
      import("./pt-BR/battle.json").then((module) => module.default),
    ranking: () =>
      import("./pt-BR/ranking.json").then((module) => module.default),
    errors: () =>
      import("./pt-BR/errors.json").then((module) => module.default),
    validation: () =>
      import("./pt-BR/validation.json").then((module) => module.default),
  },
  en: {
    common: () => import("./en/common.json").then((module) => module.default),
    home: () => import("./en/home.json").then((module) => module.default),
    auth: () => import("./en/auth.json").then((module) => module.default),
    profile: () => import("./en/profile.json").then((module) => module.default),
    game: () => import("./en/game.json").then((module) => module.default),
    battle: () => import("./en/battle.json").then((module) => module.default),
    ranking: () => import("./en/ranking.json").then((module) => module.default),
    errors: () => import("./en/errors.json").then((module) => module.default),
    validation: () =>
      import("./en/validation.json").then((module) => module.default),
  },
};

export async function loadNamespace(
  locale: Locale,
  namespace: Namespace,
): Promise<MessageRecord> {
  const localeLoaders = loaders[locale] ?? loaders[defaultLocale];
  const loader = localeLoaders[namespace];
  return loader();
}

export async function loadMessages(locale: Locale): Promise<LocaleMessages> {
  const entries = await Promise.all(
    namespaces.map(async (namespace) => {
      const messages = await loadNamespace(locale, namespace);
      return [namespace, messages] as const;
    }),
  );
  return Object.fromEntries(entries) as LocaleMessages;
}
