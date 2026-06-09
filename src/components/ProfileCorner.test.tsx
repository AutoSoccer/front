import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import "@/__tests__/mocks/router";
import {
  installLocalStorageMock,
  resetLocalStorageMock,
} from "@/__tests__/mocks/localStorage";
import { testLocale, testMessages } from "@/__tests__/utils/renderWithProviders";

import ProfileCorner from "@/components/ProfileCorner";
import type { AuthContextType } from "@/context/AuthContext";
import type { User } from "@/types/user";

const useAuthMock = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

function buildAuth(user: User | null, overrides: Partial<AuthContextType> = {}): AuthContextType {
  return {
    user,
    isAuthenticated: !!user,
    isLoading: false,
    login: vi.fn(),
    loginAsGuest: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  };
}

function renderProfileCorner(props: { coins?: number } = {}) {
  return render(
    <NextIntlClientProvider locale={testLocale} messages={testMessages}>
      <ProfileCorner {...props} />
    </NextIntlClientProvider>
  );
}

beforeAll(() => {
  installLocalStorageMock();
});

beforeEach(() => {
  resetLocalStorageMock();
  useAuthMock.mockReset();
});

describe("ProfileCorner", () => {
  it("retorna null quando nao ha usuario", () => {
    useAuthMock.mockReturnValue(buildAuth(null));

    const { container } = renderProfileCorner();

    expect(container).toBeEmptyDOMElement();
  });

  it("mostra inicial do nome do usuario", () => {
    const user: User = {
      id: 1,
      name: "Ada Lovelace",
      nickname: "ada",
      email: "ada@test.com",
      phone_number: null,
    };
    useAuthMock.mockReturnValue(buildAuth(user));

    renderProfileCorner();

    const avatar = screen.getByRole("button", { name: /Abrir menu do perfil/i });
    expect(avatar).toHaveTextContent("A");
  });

  it("usa nickname quando name eh null", () => {
    const user: User = {
      id: 2,
      name: null,
      nickname: "zico",
      email: "zico@test.com",
      phone_number: null,
    };
    useAuthMock.mockReturnValue(buildAuth(user));

    renderProfileCorner();

    expect(screen.getByRole("button", { name: /Abrir menu do perfil/i })).toHaveTextContent("Z");
  });

  it("abre menu ao clicar no avatar e mostra opcoes", () => {
    const user: User = {
      id: 1,
      name: "Carlos",
      nickname: "carlos",
      email: "c@test.com",
      phone_number: null,
    };
    useAuthMock.mockReturnValue(buildAuth(user));

    renderProfileCorner();

    const avatar = screen.getByRole("button", { name: /Abrir menu do perfil/i });
    expect(avatar).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(avatar);

    expect(avatar).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("menu");
    expect(within(menu).getByText(/Meu Perfil/i)).toBeInTheDocument();
    expect(within(menu).getByText(/Mercado/i)).toBeInTheDocument();
    expect(within(menu).getByText(/Sair/i)).toBeInTheDocument();
  });

  it("fecha o menu ao clicar fora", () => {
    const user: User = {
      id: 1,
      name: "Carlos",
      nickname: "carlos",
      email: "c@test.com",
      phone_number: null,
    };
    useAuthMock.mockReturnValue(buildAuth(user));

    renderProfileCorner();

    const avatar = screen.getByRole("button", { name: /Abrir menu do perfil/i });
    fireEvent.click(avatar);
    expect(screen.queryByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("invoca logout ao clicar em Sair", () => {
    const logout = vi.fn();
    const user: User = {
      id: 1,
      name: "Carlos",
      nickname: "carlos",
      email: "c@test.com",
      phone_number: null,
    };
    useAuthMock.mockReturnValue(buildAuth(user, { logout }));

    renderProfileCorner();

    fireEvent.click(screen.getByRole("button", { name: /Abrir menu do perfil/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Sair/i }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("fecha o menu ao clicar em Meu Perfil", () => {
    const user: User = {
      id: 1,
      name: "Carlos",
      nickname: "carlos",
      email: "c@test.com",
      phone_number: null,
    };
    useAuthMock.mockReturnValue(buildAuth(user));

    renderProfileCorner();

    fireEvent.click(screen.getByRole("button", { name: /Abrir menu do perfil/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Meu Perfil/i }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("integra LanguageSwitcher com label do common.json", () => {
    const user: User = {
      id: 1,
      name: "Carlos",
      nickname: "carlos",
      email: "c@test.com",
      phone_number: null,
    };
    useAuthMock.mockReturnValue(buildAuth(user));

    renderProfileCorner();

    expect(screen.getByRole("button", { name: /Idioma:/i })).toBeInTheDocument();
  });

  it("aceita prop coins (atualmente comentado, mas componente segue renderizando)", () => {
    const user: User = {
      id: 1,
      name: "Carlos",
      nickname: "carlos",
      email: "c@test.com",
      phone_number: null,
    };
    useAuthMock.mockReturnValue(buildAuth(user));

    renderProfileCorner({ coins: 250 });

    expect(screen.getByRole("button", { name: /Abrir menu do perfil/i })).toBeInTheDocument();
  });
});
