import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "O email ou apelido é obrigatório."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export type LoginFormInputs = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "O nome é muito curto."),
    nickname: z.string().min(2, "O apelido é muito curto."),
    email: z.string().email("Email inválido.").min(1, "O email é obrigatório."),
    phone_number: z.string().min(10, "Telefone inválido."),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
    confirmPassword: z.string().min(1, "A confirmação de senha é obrigatória."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type RegisterFormInputs = z.infer<typeof registerSchema>;
