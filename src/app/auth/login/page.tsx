"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginFormInputs } from "@/lib/schemas/auth";
import styles from "./login.module.css";

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      setError(null);
      await login(data);
    } catch {
      setError("Falha ao realizar login. Verifique suas credenciais.");
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

          {error && <p className={styles.errorText}>{error}</p>}

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
