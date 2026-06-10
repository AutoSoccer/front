import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import "@/__tests__/mocks/api";
import "@/__tests__/mocks/router";
import {
  installLocalStorageMock,
  resetLocalStorageMock,
} from "@/__tests__/mocks/localStorage";
import { resetRouterMocks } from "@/__tests__/mocks/router";
import { resetApiMocks } from "@/__tests__/mocks/api";

import { AuthContext, type AuthContextType } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";

beforeAll(() => {
  installLocalStorageMock();
});

beforeEach(() => {
  resetLocalStorageMock();
  resetRouterMocks();
  resetApiMocks();
});

describe("useAuth", () => {
  it("lanca erro quando usado fora do AuthProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth deve ser usado dentro de um AuthProvider."
    );

    consoleSpy.mockRestore();
  });

  it("retorna o valor do contexto quando usado dentro do AuthProvider", () => {
    const fakeContext: AuthContextType = {
      user: { id: 1, name: "Ada", nickname: "ada", email: "ada@test.com", phone_number: null },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      loginAsGuest: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    };

    function wrapper({ children }: { children: ReactNode }) {
      return (
        <AuthContext.Provider value={fakeContext}>{children}</AuthContext.Provider>
      );
    }

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBe(fakeContext);
    expect(result.current.user?.nickname).toBe("ada");
    expect(result.current.isAuthenticated).toBe(true);
  });
});
