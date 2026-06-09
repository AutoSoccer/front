import type { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api from "./api";

type Handler = (config: unknown) => unknown;
type ErrorHandler = (error: unknown) => unknown;

function getRequestInterceptor(): {
  fulfilled: Handler;
  rejected: ErrorHandler;
} {
  const manager = api.interceptors.request as unknown as {
    handlers: Array<{ fulfilled: Handler; rejected: ErrorHandler } | null>;
  };
  const handler = manager.handlers.find((h) => h !== null);
  if (!handler) {
    throw new Error("Request interceptor nao encontrado");
  }
  return handler;
}

function getResponseInterceptor(): {
  fulfilled: Handler;
  rejected: ErrorHandler;
} {
  const manager = api.interceptors.response as unknown as {
    handlers: Array<{ fulfilled: Handler; rejected: ErrorHandler } | null>;
  };
  const handler = manager.handlers.find((h) => h !== null);
  if (!handler) {
    throw new Error("Response interceptor nao encontrado");
  }
  return handler;
}

describe("api request interceptor", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("injeta Authorization Bearer quando token existe no localStorage", () => {
    window.localStorage.setItem("token", "meu-token-123");

    const { fulfilled } = getRequestInterceptor();
    const config = fulfilled({ headers: {} }) as {
      headers: { Authorization?: string };
    };

    expect(config.headers.Authorization).toBe("Bearer meu-token-123");
  });

  it("NAO injeta Authorization quando localStorage vazio", () => {
    const { fulfilled } = getRequestInterceptor();
    const config = fulfilled({ headers: {} }) as {
      headers: { Authorization?: string };
    };

    expect(config.headers.Authorization).toBeUndefined();
  });

  it("propaga erro do request via rejected handler", async () => {
    const { rejected } = getRequestInterceptor();
    const err = new Error("falhou na request");

    await expect(Promise.resolve(rejected(err))).rejects.toBe(err);
  });
});

describe("api response interceptor", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    window.localStorage.setItem("token", "t");
    window.localStorage.setItem("user", "{}");

    // Mock window.location.href setter
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { ...originalLocation, href: "/" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
    window.localStorage.clear();
  });

  it("retorna response inalterado no caminho feliz", () => {
    const { fulfilled } = getResponseInterceptor();
    const response = { data: { ok: true }, status: 200 };
    const result = fulfilled(response);
    expect(result).toBe(response);
  });

  it("em 401 limpa localStorage e redireciona para /auth/login", async () => {
    const { rejected } = getResponseInterceptor();
    const error = {
      response: { status: 401 },
    } as Partial<AxiosError>;

    await expect(Promise.resolve(rejected(error))).rejects.toBe(error);

    expect(window.localStorage.getItem("token")).toBeNull();
    expect(window.localStorage.getItem("user")).toBeNull();
    expect(window.location.href).toBe("/auth/login");
  });

  it("em erro NAO-401 NAO limpa storage nem redireciona", async () => {
    const { rejected } = getResponseInterceptor();
    const error = {
      response: { status: 500 },
    } as Partial<AxiosError>;

    await expect(Promise.resolve(rejected(error))).rejects.toBe(error);

    expect(window.localStorage.getItem("token")).toBe("t");
    expect(window.location.href).toBe("/");
  });

  it("em erro sem response nao quebra", async () => {
    const { rejected } = getResponseInterceptor();
    const error = new Error("network down");

    await expect(Promise.resolve(rejected(error))).rejects.toBe(error);
    expect(window.localStorage.getItem("token")).toBe("t");
  });
});

describe("api instance", () => {
  it("tem baseURL configurado", () => {
    expect(api.defaults.baseURL).toBeDefined();
  });

  it("tem header Content-Type application/json", () => {
    expect(api.defaults.headers["Content-Type"]).toBe("application/json");
  });

  it("tem timeout configurado", () => {
    expect(api.defaults.timeout).toBe(10000);
  });
});

// Silencia warning de unused import quando vi nao e usado em algum branch
void vi;
