import { vi } from "vitest";

/**
 * Mocks centralizados para o cliente axios em `@/providers/api`.
 *
 * Uso tipico em uma suite de teste:
 *
 * ```ts
 * import { mockApiGet, resetApiMocks } from "@/__tests__/mocks/api";
 *
 * vi.mock("@/providers/api");
 *
 * beforeEach(() => {
 *   resetApiMocks();
 *   mockApiGet({ data: { id: 1 } });
 * });
 * ```
 */

export const apiGet = vi.fn();
export const apiPost = vi.fn();
export const apiPut = vi.fn();
export const apiPatch = vi.fn();
export const apiDelete = vi.fn();

export const apiMock = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() },
  },
};

vi.mock("@/providers/api", () => ({
  __esModule: true,
  api: apiMock,
  default: apiMock,
}));

type AnyValue = unknown;

function resolveOnce(fn: ReturnType<typeof vi.fn>, value: AnyValue) {
  fn.mockResolvedValueOnce({ data: value });
}

function rejectOnce(fn: ReturnType<typeof vi.fn>, error: AnyValue) {
  fn.mockRejectedValueOnce(error);
}

export function mockApiGet(data: AnyValue) {
  resolveOnce(apiGet, data);
  return apiGet;
}

export function mockApiPost(data: AnyValue) {
  resolveOnce(apiPost, data);
  return apiPost;
}

export function mockApiPut(data: AnyValue) {
  resolveOnce(apiPut, data);
  return apiPut;
}

export function mockApiPatch(data: AnyValue) {
  resolveOnce(apiPatch, data);
  return apiPatch;
}

export function mockApiDelete(data: AnyValue) {
  resolveOnce(apiDelete, data);
  return apiDelete;
}

export function mockApiGetError(error: AnyValue) {
  rejectOnce(apiGet, error);
  return apiGet;
}

export function mockApiPostError(error: AnyValue) {
  rejectOnce(apiPost, error);
  return apiPost;
}

export function mockApiPutError(error: AnyValue) {
  rejectOnce(apiPut, error);
  return apiPut;
}

export function mockApiDeleteError(error: AnyValue) {
  rejectOnce(apiDelete, error);
  return apiDelete;
}

export function resetApiMocks() {
  apiGet.mockReset();
  apiPost.mockReset();
  apiPut.mockReset();
  apiPatch.mockReset();
  apiDelete.mockReset();
}
