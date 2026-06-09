import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

import AntdProvider from "@/providers/AntdProvider";
import { AuthProvider } from "@/context/AuthContext";

import commonMessages from "@/i18n/messages/pt-BR/common.json";
import authMessages from "@/i18n/messages/pt-BR/auth.json";
import homeMessages from "@/i18n/messages/pt-BR/home.json";
import gameMessages from "@/i18n/messages/pt-BR/game.json";
import battleMessages from "@/i18n/messages/pt-BR/battle.json";
import rankingMessages from "@/i18n/messages/pt-BR/ranking.json";
import profileMessages from "@/i18n/messages/pt-BR/profile.json";
import errorsMessages from "@/i18n/messages/pt-BR/errors.json";
import validationMessages from "@/i18n/messages/pt-BR/validation.json";

export const testMessages = {
  common: commonMessages,
  auth: authMessages,
  home: homeMessages,
  game: gameMessages,
  battle: battleMessages,
  ranking: rankingMessages,
  profile: profileMessages,
  errors: errorsMessages,
  validation: validationMessages,
};

export const testLocale = "pt-BR" as const;

type ProvidersProps = { children: ReactNode };

function AllProviders({ children }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={testLocale} messages={testMessages}>
      <AntdProvider>
        <AuthProvider>{children}</AuthProvider>
      </AntdProvider>
    </NextIntlClientProvider>
  );
}

export type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper">;

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderWithProvidersOptions
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
