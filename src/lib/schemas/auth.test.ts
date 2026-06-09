import { describe, expect, it } from "vitest";

import {
  buildLoginSchema,
  buildProfileSchema,
  buildRegisterSchema,
} from "./auth";

// Mock translator: retorna a propria chave para que as mensagens sejam
// deterministicas e a logica de validacao seja exercida sem next-intl.
const t = ((key: string) => key) as unknown as Parameters<
  typeof buildLoginSchema
>[0];

const loginSchema = buildLoginSchema(t);
const registerSchema = buildRegisterSchema(t);
const profileSchema = buildProfileSchema(t);

describe("loginSchema", () => {
  it("aceita identifier por email + password com 6 chars", () => {
    const result = loginSchema.safeParse({
      identifier: "user@example.com",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("aceita identifier por apelido valido", () => {
    const result = loginSchema.safeParse({
      identifier: "user_123",
      password: "abcdef",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita identifier vazio", () => {
    const result = loginSchema.safeParse({ identifier: "", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("rejeita identifier que nao e email nem apelido", () => {
    const result = loginSchema.safeParse({
      identifier: "x",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita password com menos de 6 chars", () => {
    const result = loginSchema.safeParse({
      identifier: "user@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validPayload = {
    name: "Joao Silva",
    nickname: "joao_silva",
    email: "joao@example.com",
    phone_number: "(11) 91234-5678",
    password: "abcdef",
    confirmPassword: "abcdef",
  };

  it("aceita payload completo e valido", () => {
    const result = registerSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejeita nome muito curto", () => {
    const result = registerSchema.safeParse({ ...validPayload, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejeita nome com numeros", () => {
    const result = registerSchema.safeParse({ ...validPayload, name: "Joao123" });
    expect(result.success).toBe(false);
  });

  it("rejeita nickname com 1 caractere", () => {
    const result = registerSchema.safeParse({ ...validPayload, nickname: "a" });
    expect(result.success).toBe(false);
  });

  it("rejeita nickname com mais de 20 chars", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      nickname: "a".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita email invalido", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      email: "nao-eh-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita telefone fora do formato", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      phone_number: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita password com menos de 6 chars", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      password: "abc",
      confirmPassword: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita quando confirmPassword nao bate com password", () => {
    const result = registerSchema.safeParse({
      ...validPayload,
      confirmPassword: "outraSenha",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const hasMatchError = result.error.issues.some((issue) =>
        issue.path.includes("confirmPassword"),
      );
      expect(hasMatchError).toBe(true);
    }
  });
});

describe("profileSchema", () => {
  const validPayload = {
    name: "Maria Souza",
    nickname: "mari_souza",
    email: "mari@example.com",
    phone_number: "(11) 91234-5678",
  };

  it("aceita payload valido", () => {
    const result = profileSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("aceita phone_number como string vazia", () => {
    const result = profileSchema.safeParse({ ...validPayload, phone_number: "" });
    expect(result.success).toBe(true);
  });

  it("rejeita email vazio", () => {
    const result = profileSchema.safeParse({ ...validPayload, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita nickname invalido", () => {
    const result = profileSchema.safeParse({
      ...validPayload,
      nickname: "nick com espaco",
    });
    expect(result.success).toBe(false);
  });
});
