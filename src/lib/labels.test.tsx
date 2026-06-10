import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import {
  testLocale,
  testMessages,
} from "@/__tests__/utils/renderWithProviders";

import { useAreaLabels, useRoleLabels } from "./labels";

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale={testLocale} messages={testMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe("useRoleLabels", () => {
  it("retorna as 4 chaves de role traduzidas em pt-BR", () => {
    const { result } = renderHook(() => useRoleLabels(), { wrapper: Wrapper });

    expect(result.current).toEqual({
      goalkeeper: "Goleiro",
      defender: "Defensor",
      midfielder: "Meio-campo",
      attacker: "Atacante",
    });
  });

  it("retorna objeto com exatamente 4 chaves", () => {
    const { result } = renderHook(() => useRoleLabels(), { wrapper: Wrapper });

    expect(Object.keys(result.current)).toHaveLength(4);
    expect(Object.keys(result.current).sort()).toEqual([
      "attacker",
      "defender",
      "goalkeeper",
      "midfielder",
    ]);
  });

  it("todos os valores sao strings nao vazias", () => {
    const { result } = renderHook(() => useRoleLabels(), { wrapper: Wrapper });

    for (const value of Object.values(result.current)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

describe("useAreaLabels", () => {
  it("retorna 3 areas na ordem defense, midfield, attack", () => {
    const { result } = renderHook(() => useAreaLabels(), { wrapper: Wrapper });

    expect(result.current).toEqual(["Defesa", "Centro", "Ataque"]);
  });

  it("retorna sempre um array de 3 strings", () => {
    const { result } = renderHook(() => useAreaLabels(), { wrapper: Wrapper });

    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current).toHaveLength(3);
    for (const label of result.current) {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe("useAreaLabels x useRoleLabels", () => {
  it("retorna estruturas distintas (objeto vs array)", () => {
    const { result: roles } = renderHook(() => useRoleLabels(), {
      wrapper: Wrapper,
    });
    const { result: areas } = renderHook(() => useAreaLabels(), {
      wrapper: Wrapper,
    });

    expect(Array.isArray(roles.current)).toBe(false);
    expect(Array.isArray(areas.current)).toBe(true);
  });
});
