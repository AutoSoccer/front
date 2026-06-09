import type { useTranslations } from "next-intl";

type ErrorsTranslator = ReturnType<typeof useTranslations<"errors">>;

type ApiErrorShape = {
  response?: {
    data?: {
      code?: string;
      message?: string;
    };
  };
  message?: string;
};

/**
 * Le `error.response.data.code` retornado pelo backend (apos WS-01)
 * e devolve a traducao do namespace `errors`. Se nao houver code
 * conhecido, usa `error.response.data.message` ou cai no generico.
 */
export function getErrorMessage(error: unknown, t: ErrorsTranslator): string {
  if (typeof error !== "object" || error === null) {
    return t("generic");
  }

  const apiError = error as ApiErrorShape;
  const code = apiError.response?.data?.code;

  if (code) {
    // next-intl tipa as chaves a partir do JSON; chamamos com cast
    // controlado para suportar codigos vindos dinamicamente do backend.
    const translator = t as unknown as (key: string) => string;
    const translated = translator(code);
    if (translated && translated !== code) {
      return translated;
    }
  }

  const message = apiError.response?.data?.message ?? apiError.message;
  if (message) {
    return message;
  }

  return t("generic");
}

/**
 * Extrai apenas o `code` do erro, util para mapeamentos custom.
 */
export function getErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  const apiError = error as ApiErrorShape;
  return apiError.response?.data?.code ?? null;
}
