import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import "@/__tests__/mocks/router";
import {
  installLocalStorageMock,
  readLocalStorage,
  resetLocalStorageMock,
  seedLocalStorage,
  setItemSpy,
  removeItemSpy,
} from "@/__tests__/mocks/localStorage";
import { mockPush, resetRouterMocks } from "@/__tests__/mocks/router";

import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types/user";

const loginMock = vi.fn();
const createGuestMock = vi.fn();
const getMeMock = vi.fn();
const registerMock = vi.fn();

vi.mock("@/services/authService", () => ({
  authService: {
    login: (...args: unknown[]) => loginMock(...args),
    createGuest: (...args: unknown[]) => createGuestMock(...args),
    getMe: (...args: unknown[]) => getMeMock(...args),
    register: (...args: unknown[]) => registerMock(...args),
  },
}));

const resetGameSessionMock = vi.fn();
vi.mock("@/lib/gameSession", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/gameSession")>(
      "@/lib/gameSession",
    );
  return {
    ...actual,
    resetGameSession: (...args: unknown[]) => resetGameSessionMock(...args),
  };
});

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

const guestUser: User = {
  id: 99,
  name: null,
  nickname: "guest_99",
  email: "guest@autosoccer.test",
  phone_number: null,
  is_guest: true,
};

const fullUser: User = {
  id: 1,
  name: "Ada",
  nickname: "ada",
  email: "ada@test.com",
  phone_number: null,
};

beforeAll(() => {
  installLocalStorageMock();
});

beforeEach(() => {
  resetLocalStorageMock();
  resetRouterMocks();
  loginMock.mockReset();
  createGuestMock.mockReset();
  getMeMock.mockReset();
  registerMock.mockReset();
  resetGameSessionMock.mockReset();
});

describe("AuthProvider", () => {
  it("inicia com user null e isLoading true, depois conclui loading quando nao ha token", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(getMeMock).not.toHaveBeenCalled();
  });

  it("chama getMe ao montar quando ha token e popula o user", async () => {
    seedLocalStorage({ token: "abc123" });
    getMeMock.mockResolvedValueOnce(fullUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getMeMock).toHaveBeenCalledTimes(1);
    expect(result.current.user).toEqual(fullUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("limpa localStorage quando getMe falha ao montar", async () => {
    seedLocalStorage({ token: "stale", user: JSON.stringify(fullUser) });
    getMeMock.mockRejectedValueOnce(new Error("401"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(removeItemSpy).toHaveBeenCalledWith("token");
    expect(removeItemSpy).toHaveBeenCalledWith("user");
  });

  it("login armazena token+user no localStorage, popula user e chama router.push('/')", async () => {
    loginMock.mockResolvedValueOnce({ token: "tok-1", user: fullUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login({ identifier: "ada", password: "secret1" });
    });

    expect(loginMock).toHaveBeenCalledWith({
      identifier: "ada",
      password: "secret1",
    });
    expect(setItemSpy).toHaveBeenCalledWith("token", "tok-1");
    expect(setItemSpy).toHaveBeenCalledWith("user", JSON.stringify(fullUser));
    expect(readLocalStorage()).toMatchObject({
      token: "tok-1",
      user: JSON.stringify(fullUser),
    });
    expect(result.current.user).toEqual(fullUser);
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("loginAsGuest cria sessao guest, reseta game session e redireciona para /", async () => {
    createGuestMock.mockResolvedValueOnce({
      token: "guest-tok",
      user: guestUser,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.loginAsGuest();
    });

    expect(createGuestMock).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith("token", "guest-tok");
    expect(setItemSpy).toHaveBeenCalledWith("user", JSON.stringify(guestUser));
    expect(resetGameSessionMock).toHaveBeenCalledTimes(1);
    expect(result.current.user).toEqual(guestUser);
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("logout limpa localStorage, zera user e redireciona para login", async () => {
    seedLocalStorage({ token: "tok", user: JSON.stringify(fullUser) });
    getMeMock.mockResolvedValueOnce(fullUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(fullUser);
    });

    act(() => {
      result.current.logout();
    });

    expect(removeItemSpy).toHaveBeenCalledWith("token");
    expect(removeItemSpy).toHaveBeenCalledWith("user");
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });

  it("register encaminha dados ao authService e redireciona para /auth/login", async () => {
    registerMock.mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const payload = {
      name: "Ada Lovelace",
      nickname: "ada",
      email: "ada@test.com",
      phone_number: "11999999999",
      password: "secret1",
      confirmPassword: "secret1",
    };

    await act(async () => {
      await result.current.register(payload);
    });

    expect(registerMock).toHaveBeenCalledWith(payload);
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });
});
