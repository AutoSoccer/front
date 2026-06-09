import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import AntdProvider from "@/providers/AntdProvider";
import { AuthProvider } from "@/context/AuthContext";

// TODO: integrar NextIntlClientProvider apos merge de WS-07/08

type ProvidersProps = { children: ReactNode };

function AllProviders({ children }: ProvidersProps) {
  return (
    <AntdProvider>
      <AuthProvider>{children}</AuthProvider>
    </AntdProvider>
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
