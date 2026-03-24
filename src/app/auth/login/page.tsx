"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { loginSchema, type LoginFormInputs } from "@/lib/schemas/auth";
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
    // Simulando o delay de uma requisição
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Login efetuado com sucesso:", data);
  };

  return (
    <main className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Acesse sua conta</h1>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">
              E-mail
            </label>
            <div className={styles.inputContainer}>
              <Mail className={styles.icon} size={20} />
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className={styles.input}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className={styles.errorText}>{errors.email.message}</p>
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
