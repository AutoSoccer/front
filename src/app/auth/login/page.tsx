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
  const [remember, setRemember] = useState(true);

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
      <aside className={styles.heroSide} aria-hidden="true">
        <div className={styles.heroPattern} />
        <span className={styles.heroLogo}>⚽</span>
        <span className={styles.heroFooter}>
          AutoSoccer · Monte sua equipe e jogue como um lord
        </span>
      </aside>

      <section className={styles.formSide}>
        <div className={styles.formInner}>
          <div className={styles.brandWrap}>
            <span className={styles.brandMark}>⚽</span>
            <span className={styles.brandTitle}>AutoSoccer</span>
          </div>

          <div className={styles.heading}>
            <h1 className={styles.title}>Acesse a sua conta!</h1>
            <p className={styles.subtitle}>
              Por favor, insira os seus dados para acessar o painel.
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="identifier">
                E-mail ou Apelido
              </label>
              <div className={styles.inputContainer}>
                <User className={styles.icon} size={18} />
                <input
                  id="identifier"
                  type="text"
                  placeholder="Digite aqui o seu e-mail..."
                  className={styles.input}
                  autoComplete="username"
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
                <Lock className={styles.icon} size={18} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  className={styles.input}
                  autoComplete="current-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  className={styles.iconRight}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className={styles.errorText}>{errors.password.message}</p>
              )}
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Lembrar-me
            </label>

            {error && <p className={styles.errorText}>{error}</p>}

            <button
              type="submit"
              className={styles.button}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Acessar Conta"}
            </button>
          </form>

          <p className={styles.footerText}>
            Não possui uma conta?{" "}
            <Link href="/auth/register" className={styles.link}>
              Cadastre-se
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
