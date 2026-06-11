import "@/__tests__/mocks/router";

import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  renderWithProviders,
  screen,
} from "@/__tests__/utils/renderWithProviders";
import { themeCookieName } from "@/lib/theme";

import ThemeSwitcher from "./ThemeSwitcher";

const clearCookies = () => {
  for (const part of document.cookie.split(";")) {
    const [key] = part.trim().split("=");
    if (key) {
      document.cookie = `${key}=; path=/; max-age=0`;
    }
  }
  document.documentElement.removeAttribute("data-theme");
};

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    clearCookies();
  });

  afterEach(() => {
    clearCookies();
  });

  it("renderiza com label do tema alvo (dark quando atual e light)", () => {
    renderWithProviders(<ThemeSwitcher initialTheme="light" />);
    expect(screen.getByRole("button", { name: /Tema: Escuro/i })).toBeTruthy();
  });

  it("alterna o tema ao clicar e persiste em cookie", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeSwitcher initialTheme="light" />);

    const button = screen.getByRole("button", { name: /Tema: Escuro/i });
    await user.click(button);

    expect(document.cookie).toContain(`${themeCookieName}=dark`);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: /Tema: Claro/i })).toBeTruthy();
  });

  it("retorna para light em um segundo clique", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeSwitcher initialTheme="light" />);

    const button = screen.getByRole("button", { name: /Tema: Escuro/i });
    await user.click(button);
    await user.click(screen.getByRole("button", { name: /Tema: Claro/i }));

    expect(document.cookie).toContain(`${themeCookieName}=light`);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
