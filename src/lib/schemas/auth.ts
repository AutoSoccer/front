import { z } from "zod";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NICKNAME_REGEX = /^[a-zA-Z0-9_]{2,20}$/;
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' ]{2,60}$/;
const PHONE_REGEX = /^\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}$/;
const PASSWORD_REGEX = /^.{6,}$/;

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "O e-mail ou apelido é obrigatório.")
    .refine(
      (value) => EMAIL_REGEX.test(value) || NICKNAME_REGEX.test(value),
      "Informe um e-mail ou apelido válido.",
    ),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres.")
    .regex(PASSWORD_REGEX, "Senha inválida."),
});

export type LoginFormInputs = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "O nome é muito curto.")
      .regex(NAME_REGEX, "O nome deve conter apenas letras."),
    nickname: z
      .string()
      .regex(
        NICKNAME_REGEX,
        "O apelido deve ter de 2 a 20 caracteres (letras, números e _).",
      ),
    email: z
      .string()
      .min(1, "O e-mail é obrigatório.")
      .regex(EMAIL_REGEX, "E-mail inválido."),
    phone_number: z
      .string()
      .regex(PHONE_REGEX, "Telefone inválido. Use o formato (00) 00000-0000."),
    password: z
      .string()
      .min(6, "A senha deve ter pelo menos 6 caracteres.")
      .regex(PASSWORD_REGEX, "Senha inválida."),
    confirmPassword: z
      .string()
      .min(1, "A confirmação de senha é obrigatória."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type RegisterFormInputs = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, "O nome é muito curto.")
    .regex(NAME_REGEX, "O nome deve conter apenas letras."),
  nickname: z
    .string()
    .regex(
      NICKNAME_REGEX,
      "O apelido deve ter de 2 a 20 caracteres (letras, números e _).",
    ),
  email: z
    .string()
    .min(1, "O e-mail é obrigatório.")
    .regex(EMAIL_REGEX, "E-mail inválido."),
  phone_number: z
    .string()
    .regex(PHONE_REGEX, "Telefone inválido. Use o formato (00) 00000-0000.")
    .or(z.literal("")),
});

export type ProfileFormInputs = z.infer<typeof profileSchema>;
