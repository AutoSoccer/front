"use client";

import {
  EnvironmentOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "antd";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import {
  buildRegisterSchema,
  type RegisterFormInputs,
} from "@/lib/schemas/auth";
import styles from "./register.module.css";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const t = useTranslations("auth.register");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const tErrors = useTranslations("errors");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerSchema = useMemo(
    () => buildRegisterSchema(tValidation),
    [tValidation],
  );

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
    } catch (err) {
      setError(getErrorMessage(err, tErrors) || t("errorGeneric"));
    }
  };

  return (
    <main className={styles.container}>
      <span className={styles.brandFloating} aria-label={tCommon("appName")}>
        <img src="/logo.png" alt={tCommon("appName")} />
      </span>

      <form className={styles.card} onSubmit={handleSubmit(onSubmit)}>
        <h1 className={styles.title}>{t("title")}</h1>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="name">
            {t("name")}
          </label>
          <div className={styles.inputWrap}>
            <UserOutlined className={styles.inputIcon} />
            <input
              id="name"
              type="text"
              placeholder={t("namePlaceholder")}
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
              {t("nickname")}
            </label>
            <div className={styles.inputWrap}>
              <UserOutlined className={styles.inputIcon} />
              <input
                id="nickname"
                type="text"
                placeholder={t("nicknamePlaceholder")}
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
              {t("phone")}
            </label>
            <div className={styles.inputWrap}>
              <PhoneOutlined className={styles.inputIcon} />
              <input
                id="phone_number"
                type="tel"
                placeholder={t("phonePlaceholder")}
                inputMode="numeric"
                maxLength={15}
                className={styles.input}
                {...register("phone_number", {
                  onChange: (event) => {
                    event.target.value = formatPhone(event.target.value);
                  },
                })}
              />
            </div>
            {errors.phone_number && (
              <p className={styles.errorText}>{errors.phone_number.message}</p>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="city">
            {t("city")}
          </label>
          <div className={styles.inputWrap}>
            <EnvironmentOutlined className={styles.inputIcon} />
            <input
              id="city"
              type="text"
              placeholder={t("cityPlaceholder")}
              className={styles.input}
              {...register("city")}
            />
          </div>
          {errors.city && (
            <p className={styles.errorText}>{errors.city.message}</p>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="email">
            {t("email")}
          </label>
          <div className={styles.inputWrap}>
            <MailOutlined className={styles.inputIcon} />
            <input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
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
              {t("password")}
            </label>
            <div className={styles.inputWrap}>
              <LockOutlined className={styles.inputIcon} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("passwordPlaceholder")}
                className={styles.input}
                {...register("password")}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? t("hidePassword") : t("showPassword")
                }
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
              {t("confirm")}
            </label>
            <div className={styles.inputWrap}>
              <LockOutlined className={styles.inputIcon} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("confirmPlaceholder")}
                className={styles.input}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={
                  showConfirmPassword ? t("hidePassword") : t("showPassword")
                }
              >
                {showConfirmPassword ? (
                  <EyeInvisibleOutlined />
                ) : (
                  <EyeOutlined />
                )}
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
          {t("submit")}
        </Button>

        <p className={styles.footerText}>
          {t("alreadyHaveAccount")}{" "}
          <Link href="/auth/login" className={styles.link}>
            {t("signIn")}
          </Link>
        </p>
      </form>
    </main>
  );
}
