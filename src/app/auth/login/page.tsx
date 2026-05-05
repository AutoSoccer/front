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
      setError("Falha ao entrar. Verifique e-mail/apelido e senha.");
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
            Email
          </label>
          <input
            id="identifier"
            type="text"
            placeholder="Enter email..."
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
            Password
          </label>
          <div className={styles.passwordWrap}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password..."
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
          Forgot Password
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
            Log In
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
                Register
              </Button>
            </Link>
            <Link href="/game" className={styles.guestLink}>
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
                Play as Guest
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}
