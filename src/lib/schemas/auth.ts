import type { useTranslations } from "next-intl";
import { z } from "zod";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NICKNAME_REGEX = /^[a-zA-Z0-9_]{2,20}$/;
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' ]{2,60}$/;
const PHONE_REGEX = /^\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}$/;
const PASSWORD_REGEX = /^.{6,}$/;

type ValidationTranslator = ReturnType<typeof useTranslations<"validation">>;

/**
 * Constroi o schema de login com mensagens de erro traduzidas.
 * Receba `t` do hook `useTranslations("validation")`.
 */
export function buildLoginSchema(t: ValidationTranslator) {
  return z.object({
    identifier: z
      .string()
      .min(1, t("auth.identifierRequired"))
      .refine(
        (value) => EMAIL_REGEX.test(value) || NICKNAME_REGEX.test(value),
        t("auth.identifierInvalid"),
      ),
    password: z
      .string()
      .min(6, t("auth.passwordMin"))
      .regex(PASSWORD_REGEX, t("auth.passwordInvalid")),
  });
}

export type LoginFormInputs = z.infer<ReturnType<typeof buildLoginSchema>>;

/**
 * Constroi o schema de registro com mensagens de erro traduzidas.
 */
export function buildRegisterSchema(t: ValidationTranslator) {
  return z
    .object({
      name: z
        .string()
        .min(2, t("auth.nameMin"))
        .regex(NAME_REGEX, t("auth.nameInvalid")),
      nickname: z.string().regex(NICKNAME_REGEX, t("auth.nickname")),
      email: z
        .string()
        .min(1, t("auth.emailRequired"))
        .regex(EMAIL_REGEX, t("auth.emailInvalid")),
      phone_number: z.string().regex(PHONE_REGEX, t("auth.phoneInvalid")),
      password: z
        .string()
        .min(6, t("auth.passwordMin"))
        .regex(PASSWORD_REGEX, t("auth.passwordInvalid")),
      confirmPassword: z.string().min(1, t("auth.confirmRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.passwordsMismatch"),
      path: ["confirmPassword"],
    });
}

export type RegisterFormInputs = z.infer<ReturnType<typeof buildRegisterSchema>>;

/**
 * Constroi o schema do perfil com mensagens de erro traduzidas.
 */
export function buildProfileSchema(t: ValidationTranslator) {
  return z.object({
    name: z
      .string()
      .min(2, t("auth.nameMin"))
      .regex(NAME_REGEX, t("auth.nameInvalid")),
    nickname: z.string().regex(NICKNAME_REGEX, t("auth.nickname")),
    email: z
      .string()
      .min(1, t("auth.emailRequired"))
      .regex(EMAIL_REGEX, t("auth.emailInvalid")),
    phone_number: z
      .string()
      .regex(PHONE_REGEX, t("auth.phoneInvalid"))
      .or(z.literal("")),
  });
}

export type ProfileFormInputs = z.infer<ReturnType<typeof buildProfileSchema>>;
