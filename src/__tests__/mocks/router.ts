import { vi } from "vitest";

/**
 * Mocks padrao de `next/navigation` para uso em testes.
 *
 * As funcoes de navegacao expostas (mockPush/mockReplace/...) sao spies
 * compartilhados — use `resetRouterMocks()` em `beforeEach` para limpar.
 *
 * Uso tipico:
 *
 * ```ts
 * import { mockPush, resetRouterMocks } from "@/__tests__/mocks/router";
 *
 * vi.mock("next/navigation");
 *
 * beforeEach(() => resetRouterMocks());
 * ```
 */

export const mockPush = vi.fn();
export const mockReplace = vi.fn();
export const mockBack = vi.fn();
export const mockForward = vi.fn();
export const mockRefresh = vi.fn();
export const mockPrefetch = vi.fn();

export const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  forward: mockForward,
  refresh: mockRefresh,
  prefetch: mockPrefetch,
};

export const mockSearchParams = new URLSearchParams();
export let mockPathname = "/";

export function setMockPathname(pathname: string) {
  mockPathname = pathname;
}

export const useRouter = vi.fn(() => mockRouter);
export const useSearchParams = vi.fn(() => mockSearchParams);
export const usePathname = vi.fn(() => mockPathname);
export const useParams = vi.fn(() => ({}));
export const redirect = vi.fn();
export const notFound = vi.fn();

vi.mock("next/navigation", () => ({
  __esModule: true,
  useRouter,
  useSearchParams,
  usePathname,
  useParams,
  redirect,
  notFound,
}));

export function resetRouterMocks() {
  mockPush.mockReset();
  mockReplace.mockReset();
  mockBack.mockReset();
  mockForward.mockReset();
  mockRefresh.mockReset();
  mockPrefetch.mockReset();
  redirect.mockReset();
  notFound.mockReset();
  setMockPathname("/");
}
