"use client";

import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "antd";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterFormInputs } from "@/lib/schemas/auth";
import styles from "./register.module.css";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      setError(null);
      await registerUser(data);
    } catch {
      setError("Falha ao realizar cadastro. Tente novamente.");
    }
  };

  return (
    <main className={styles.container}>
      <span className={styles.brandFloating} aria-hidden="true">
        AutoSoccer
        <span className={styles.brandSub}>⚽</span>
      </span>

      <form className={styles.card} onSubmit={handleSubmit(onSubmit)}>
        <h1 className={styles.title}>Crie a sua conta</h1>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="name">
            Nome completo
          </label>
          <div className={styles.inputWrap}>
            <UserOutlined className={styles.inputIcon} />
            <input
              id="name"
              type="text"
              placeholder="Seu nome"
              className={styles.input}
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className={styles.errorText}>{errors.name.message}</p>
          )}
        </div>

        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="nickname">
              Apelido
            </label>
            <div className={styles.inputWrap}>
              <UserOutlined className={styles.inputIcon} />
              <input
                id="nickname"
                type="text"
                placeholder="Seu nick"
                className={styles.input}
                {...register("nickname")}
              />
            </div>
            {errors.nickname && (
              <p className={styles.errorText}>{errors.nickname.message}</p>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="phone_number">
              Telefone
            </label>
            <div className={styles.inputWrap}>
              <PhoneOutlined className={styles.inputIcon} />
              <input
                id="phone_number"
                type="tel"
                placeholder="(00) 00000-0000"
                className={styles.input}
                {...register("phone_number")}
              />
            </div>
            {errors.phone_number && (
              <p className={styles.errorText}>{errors.phone_number.message}</p>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="email">
            E-mail
          </label>
          <div className={styles.inputWrap}>
            <MailOutlined className={styles.inputIcon} />
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

        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">
              Senha
            </label>
            <div className={styles.inputWrap}>
              <LockOutlined className={styles.inputIcon} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Crie uma senha"
                className={styles.input}
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

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="confirmPassword">
              Confirmar
            </label>
            <div className={styles.inputWrap}>
              <LockOutlined className={styles.inputIcon} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repita"
                className={styles.input}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={
                  showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                }
              >
                {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className={styles.errorText}>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          loading={isSubmitting}
          block
          style={{
            height: 56,
            fontSize: "1.3rem",
            fontWeight: 800,
            border: "4px solid #1f2937",
            boxShadow: "0 6px 0 #b45309",
            textShadow: "0 2px 0 rgba(0,0,0,0.15)",
            marginTop: "0.4rem",
          }}
        >
          Criar Conta
        </Button>

        <p className={styles.footerText}>
          Já possui uma conta?{" "}
          <Link href="/auth/login" className={styles.link}>
            Entrar
          </Link>
        </p>
      </form>
    </main>
  );
}
