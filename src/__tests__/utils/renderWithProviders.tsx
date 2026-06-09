import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

import AntdProvider from "@/providers/AntdProvider";
import { AuthProvider } from "@/context/AuthContext";

import authMessages from "@/i18n/messages/pt-BR/auth.json";
import battleMessages from "@/i18n/messages/pt-BR/battle.json";
import commonMessages from "@/i18n/messages/pt-BR/common.json";
import errorsMessages from "@/i18n/messages/pt-BR/errors.json";
import gameMessages from "@/i18n/messages/pt-BR/game.json";
import homeMessages from "@/i18n/messages/pt-BR/home.json";
import profileMessages from "@/i18n/messages/pt-BR/profile.json";
import rankingMessages from "@/i18n/messages/pt-BR/ranking.json";
import validationMessages from "@/i18n/messages/pt-BR/validation.json";

const testMessages = {
  common: commonMessages,
  home: homeMessages,
  auth: authMessages,
  profile: profileMessages,
  game: gameMessages,
  battle: battleMessages,
  ranking: rankingMessages,
  errors: errorsMessages,
  validation: validationMessages,
};

type ProvidersProps = { children: ReactNode };

function AllProviders({ children }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale="pt-BR" messages={testMessages}>
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
