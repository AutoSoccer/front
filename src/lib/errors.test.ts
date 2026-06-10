import { describe, expect, it, vi } from "vitest";

import { getErrorCode, getErrorMessage } from "./errors";

type Translator = (key: string) => string;

/**
 * Mock simples do tradutor next-intl. Quando a chave existir em `dict`,
 * devolve o valor; caso contrario, retorna a propria chave (comportamento
 * padrao do i18next quando uma chave nao tem traducao).
 */
const buildTranslator = (dict: Record<string, string>): Translator => {
  return (key: string) => dict[key] ?? key;
};

describe("getErrorMessage", () => {
  const t = buildTranslator({
    generic: "Algo deu errado.",
    UNAUTHORIZED: "Voce precisa estar logado.",
    INSUFFICIENT_BALANCE: "Saldo insuficiente.",
  });

  it("retorna a mensagem generica quando o erro nao e objeto", () => {
    expect(getErrorMessage(null, t as never)).toBe("Algo deu errado.");
    expect(getErrorMessage(undefined, t as never)).toBe("Algo deu errado.");
    expect(getErrorMessage("erro string", t as never)).toBe("Algo deu errado.");
    expect(getErrorMessage(42, t as never)).toBe("Algo deu errado.");
    expect(getErrorMessage(true, t as never)).toBe("Algo deu errado.");
  });

  it("traduz o code do backend quando existe no namespace", () => {
    const error = {
      response: {
        data: {
          code: "UNAUTHORIZED",
          message: "Original do backend",
        },
      },
    };
    expect(getErrorMessage(error, t as never)).toBe(
      "Voce precisa estar logado."
    );
  });

  it("traduz o code mesmo sem message do backend", () => {
    const error = {
      response: {
        data: {
          code: "INSUFFICIENT_BALANCE",
        },
      },
    };
    expect(getErrorMessage(error, t as never)).toBe("Saldo insuficiente.");
  });

  it("usa o message do backend quando code nao tem traducao", () => {
    const error = {
      response: {
        data: {
          code: "CODE_DESCONHECIDO",
          message: "Mensagem custom do backend",
        },
      },
    };
    expect(getErrorMessage(error, t as never)).toBe(
      "Mensagem custom do backend"
    );
  });

  it("usa o error.message como fallback quando nao ha response.data", () => {
    const error = new Error("Erro de rede");
    expect(getErrorMessage(error, t as never)).toBe("Erro de rede");
  });

  it("retorna generic quando nao ha code, message ou response", () => {
    expect(getErrorMessage({}, t as never)).toBe("Algo deu errado.");
  });

  it("retorna generic quando code e message vazio mas existe response", () => {
    const error = { response: { data: {} } };
    expect(getErrorMessage(error, t as never)).toBe("Algo deu errado.");
  });

  it("aceita response.data.message sem code", () => {
    const error = {
      response: { data: { message: "So mensagem, sem code" } },
    };
    expect(getErrorMessage(error, t as never)).toBe("So mensagem, sem code");
  });

  it("prefere response.data.message sobre error.message quando ambos existem", () => {
    const error = {
      message: "Erro axios",
      response: { data: { message: "Erro do backend" } },
    };
    expect(getErrorMessage(error, t as never)).toBe("Erro do backend");
  });

  it("chama o tradutor com a chave correta para o code", () => {
    const tMock = vi.fn((key: string) => key);
    const error = { response: { data: { code: "TEAM_NOT_FOUND" } } };
    getErrorMessage(error, tMock as never);
    expect(tMock).toHaveBeenCalledWith("TEAM_NOT_FOUND");
  });
});

describe("getErrorCode", () => {
  it("retorna null para valores nao-objeto", () => {
    expect(getErrorCode(null)).toBeNull();
    expect(getErrorCode(undefined)).toBeNull();
    expect(getErrorCode("erro")).toBeNull();
    expect(getErrorCode(123)).toBeNull();
    expect(getErrorCode(false)).toBeNull();
  });

  it("retorna null quando nao ha response.data.code", () => {
    expect(getErrorCode({})).toBeNull();
    expect(getErrorCode({ message: "erro" })).toBeNull();
    expect(getErrorCode({ response: {} })).toBeNull();
    expect(getErrorCode({ response: { data: {} } })).toBeNull();
    expect(
      getErrorCode({ response: { data: { message: "sem code" } } })
    ).toBeNull();
  });

  it("retorna o code quando presente em response.data", () => {
    const error = {
      response: { data: { code: "TEAM_NOT_FOUND", message: "..." } },
    };
    expect(getErrorCode(error)).toBe("TEAM_NOT_FOUND");
  });

  it("retorna o code mesmo quando outras propriedades estao ausentes", () => {
    const error = { response: { data: { code: "X" } } };
    expect(getErrorCode(error)).toBe("X");
  });
});
