"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
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
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Crie sua conta</h1>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="name">
              Nome completo
            </label>
            <div className={styles.inputContainer}>
              <User className={styles.icon} size={20} />
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

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="nickname">
              Apelido
            </label>
            <div className={styles.inputContainer}>
              <User className={styles.icon} size={20} />
              <input
                id="nickname"
                type="text"
                placeholder="Seu apelido"
                className={styles.input}
                {...register("nickname")}
              />
            </div>
            {errors.nickname && (
              <p className={styles.errorText}>{errors.nickname.message}</p>
            )}
          </div>

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
            <label className={styles.label} htmlFor="phone_number">
              Telefone
            </label>
            <div className={styles.inputContainer}>
              <Phone className={styles.icon} size={20} />
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

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">
              Senha
            </label>
            <div className={styles.inputContainer}>
              <Lock className={styles.icon} size={20} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Crie uma senha"
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

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="confirmPassword">
              Confirme a senha
            </label>
            <div className={styles.inputContainer}>
              <Lock className={styles.icon} size={20} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repita sua senha"
                className={styles.input}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                className={styles.iconRight}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                }
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className={styles.errorText}>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button
            type="submit"
            className={styles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <p className={styles.footerText}>
          Já possui uma conta?{" "}
          <Link href="/auth/login" className={styles.link}>
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
