import { vi } from "vitest";

/**
 * Stub controlavel de `window.localStorage` para testes.
 *
 * Diferente do localStorage real do happy-dom, esta versao expoe spies
 * (`setItemSpy`, `getItemSpy`, ...) para asserir chamadas e permite popular
 * estado inicial via `seedLocalStorage`.
 *
 * Uso tipico:
 *
 * ```ts
 * import {
 *   installLocalStorageMock,
 *   resetLocalStorageMock,
 *   seedLocalStorage,
 * } from "@/__tests__/mocks/localStorage";
 *
 * beforeAll(() => installLocalStorageMock());
 * beforeEach(() => {
 *   resetLocalStorageMock();
 *   seedLocalStorage({ token: "abc" });
 * });
 * ```
 */

let store: Record<string, string> = {};

export const getItemSpy = vi.fn((key: string) =>
  Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
);

export const setItemSpy = vi.fn((key: string, value: string) => {
  store[key] = String(value);
});

export const removeItemSpy = vi.fn((key: string) => {
  delete store[key];
});

export const clearSpy = vi.fn(() => {
  store = {};
});

export const keySpy = vi.fn((index: number) => Object.keys(store)[index] ?? null);

export const localStorageMock = {
  get length() {
    return Object.keys(store).length;
  },
  getItem: getItemSpy,
  setItem: setItemSpy,
  removeItem: removeItemSpy,
  clear: clearSpy,
  key: keySpy,
};

export function installLocalStorageMock() {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    writable: true,
    value: localStorageMock,
  });
}

export function seedLocalStorage(values: Record<string, string>) {
  store = { ...values };
}

export function readLocalStorage(): Record<string, string> {
  return { ...store };
}

export function resetLocalStorageMock() {
  store = {};
  getItemSpy.mockClear();
  setItemSpy.mockClear();
  removeItemSpy.mockClear();
  clearSpy.mockClear();
  keySpy.mockClear();
}
