import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/providers/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from "@/providers/api";
import { authService } from "./authService";

const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  mockedApi.get.mockReset();
  mockedApi.post.mockReset();
});

describe("authService.login", () => {
  it("envia payload para /auth/login e retorna data", async () => {
    const fakeResponse = {
      data: { token: "abc", user: { id: 1, nickname: "u1" } },
    };
    mockedApi.post.mockResolvedValueOnce(fakeResponse);

    const payload = { identifier: "user@example.com", password: "123456" };
    const result = await authService.login(payload);

    expect(mockedApi.post).toHaveBeenCalledWith("/auth/login", payload);
    expect(result).toEqual(fakeResponse.data);
  });

  it("propaga erro do api.post", async () => {
    mockedApi.post.mockRejectedValueOnce(new Error("falhou"));
    await expect(
      authService.login({ identifier: "x@y.com", password: "123456" }),
    ).rejects.toThrow("falhou");
  });
});

describe("authService.createGuest", () => {
  it("chama POST /auth/guest sem body explicito e retorna data", async () => {
    const fakeResponse = {
      data: { token: "guest-token", user: { id: 99, is_guest: true } },
    };
    mockedApi.post.mockResolvedValueOnce(fakeResponse);

    const result = await authService.createGuest();

    expect(mockedApi.post).toHaveBeenCalledWith("/auth/guest");
    expect(result).toEqual(fakeResponse.data);
  });
});

describe("authService.getMe", () => {
  it("chama GET /auth/me e retorna user", async () => {
    const user = { id: 5, nickname: "u5", email: "u5@x.com" };
    mockedApi.get.mockResolvedValueOnce({ data: user });

    const result = await authService.getMe();

    expect(mockedApi.get).toHaveBeenCalledWith("/auth/me");
    expect(result).toEqual(user);
  });
});

describe("authService.register", () => {
  it("strip confirmPassword antes de enviar e usa POST /auth/register", async () => {
    const fakeResponse = { data: { token: "t", user: { id: 1 } } };
    mockedApi.post.mockResolvedValueOnce(fakeResponse);

    const payload = {
      name: "Joao Silva",
      nickname: "joao_silva",
      email: "joao@x.com",
      phone_number: "(11) 91234-5678",
      password: "abcdef",
      confirmPassword: "abcdef",
    };

    const result = await authService.register(payload);

    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    const [url, body] = mockedApi.post.mock.calls[0];
    expect(url).toBe("/auth/register");
    expect(body).toEqual({
      name: "Joao Silva",
      nickname: "joao_silva",
      email: "joao@x.com",
      password: "abcdef",
      phone_number: "(11) 91234-5678",
    });
    expect(body).not.toHaveProperty("confirmPassword");
    expect(result).toEqual(fakeResponse.data);
  });
});
