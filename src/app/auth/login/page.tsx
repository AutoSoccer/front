"use client";

import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "antd";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginFormInputs } from "@/lib/schemas/auth";
import styles from "./login.module.css";

export default function LoginPage() {
  const { login, loginAsGuest } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

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
      setError("Falha ao entrar. Verifique e-mail/apelido e senha.");
    }
  };

  const onGuest = async () => {
    setError(null);
    setIsGuestLoading(true);
    try {
      await loginAsGuest();
    } catch {
      setError("Não foi possível entrar como convidado.");
      setIsGuestLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <span className={styles.brandFloating} aria-label="AutoSoccer">
        <img src="/logo.png" alt="AutoSoccer" />
      </span>

      <form className={styles.card} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="identifier">
            E-mail
          </label>
          <input
            id="identifier"
            type="text"
            placeholder="Digite seu e-mail..."
            className={styles.input}
            autoComplete="username"
            {...register("identifier")}
          />
          {errors.identifier && (
            <p className={styles.errorText}>{errors.identifier.message}</p>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="password">
            Senha
          </label>
          <div className={styles.passwordWrap}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha..."
              className={styles.input}
              autoComplete="current-password"
              {...register("password")}
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </button>
          </div>
          {errors.password && (
            <p className={styles.errorText}>{errors.password.message}</p>
          )}
        </div>

        <button
          type="button"
          className={styles.forgot}
          onClick={() =>
            setError("Funcionalidade de recuperar senha em breve.")
          }
        >
          Esqueci minha senha
        </button>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.actions}>
          <Button
            htmlType="submit"
            type="primary"
            size="large"
            loading={isSubmitting}
            block
            style={{
              height: 60,
              fontSize: "1.5rem",
              fontWeight: 800,
              border: "4px solid #1f2937",
              boxShadow: "0 6px 0 #b45309",
              textShadow: "0 2px 0 rgba(0,0,0,0.18)",
            }}
          >
            Entrar
          </Button>

          <div className={styles.smallButtonsRow}>
            <Link href="/auth/register" className={styles.guestLink}>
              <Button
                type="primary"
                size="large"
                block
                style={{
                  height: 50,
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  border: "4px solid #1f2937",
                  boxShadow: "0 5px 0 #b45309",
                }}
              >
                Cadastrar
              </Button>
            </Link>
            <Button
              type="primary"
              size="large"
              block
              loading={isGuestLoading}
              onClick={onGuest}
              className={styles.guestLink}
              style={{
                height: 50,
                fontSize: "1.1rem",
                fontWeight: 800,
                border: "4px solid #1f2937",
                boxShadow: "0 5px 0 #b45309",
              }}
            >
              Jogar como Convidado
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
