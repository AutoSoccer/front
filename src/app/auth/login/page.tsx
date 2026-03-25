"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { loginSchema, type LoginFormInputs } from "@/lib/schemas/auth";
import { authService } from "@/services/authService";
import styles from "./login.module.css";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const response = await authService.login(data);
      console.log("Login efetuado com sucesso:", response);
      alert("Login efetuado com sucesso!");
      // TODO: Redirecionar pra Home
      if (response?.token) {
        localStorage.setItem("token", response.token);
        // Opcional: já deixei preparado para salvar os dados do usuário se você quiser
        if (response?.user) {
          localStorage.setItem("user", JSON.stringify(response.user));
        }
      }
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Falha ao realizar login. Verifique suas credenciais na API.");
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Acesse sua conta</h1>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="identifier">
              E-mail ou Apelido
            </label>
            <div className={styles.inputContainer}>
              <User className={styles.icon} size={20} />
              <input
                id="identifier"
                type="text"
                placeholder="seu@email.com ou seunick"
                className={styles.input}
                {...register("identifier")}
              />
            </div>
            {errors.identifier && (
              <p className={styles.errorText}>{errors.identifier.message}</p>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">
              Senha
            </label>
            <div className={styles.inputContainer}>
              <Lock className={styles.icon} size={20} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                className={styles.input}
                {...register("password")}
              />
              <button
                type="button"
                className={styles.iconRight}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className={styles.errorText}>{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className={styles.footerText}>
          Não possui uma conta?{" "}
          <Link href="/auth/register" className={styles.link}>
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  );
}
