"use client";

import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "antd";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import { buildLoginSchema, type LoginFormInputs } from "@/lib/schemas/auth";
import styles from "./login.module.css";

export default function LoginPage() {
  const { login, loginAsGuest } = useAuth();
  const t = useTranslations("auth.login");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const tErrors = useTranslations("errors");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const loginSchema = useMemo(
    () => buildLoginSchema(tValidation),
    [tValidation],
  );

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
    } catch (err) {
      setError(getErrorMessage(err, tErrors) || t("errorGeneric"));
    }
  };

  const handleGuestLogin = async () => {
    try {
      setError(null);
      setIsGuestLoading(true);
      await loginAsGuest();
    } catch (err) {
      setError(getErrorMessage(err, tErrors) || t("errorGuest"));
      setIsGuestLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <span className={styles.brandFloating} aria-label={tCommon("appName")}>
        <img src="/logo.png" alt={tCommon("appName")} />
      </span>

      <form className={styles.card} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="identifier">
            {t("email")}
          </label>
          <input
            id="identifier"
            type="text"
            placeholder={t("emailPlaceholder")}
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
            {t("password")}
          </label>
          <div className={styles.passwordWrap}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("passwordPlaceholder")}
              className={styles.input}
              autoComplete="current-password"
              {...register("password")}
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
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
          onClick={() => setError(t("forgotInfo"))}
        >
          {t("forgot")}
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
            {t("submit")}
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
                {t("register")}
              </Button>
            </Link>
            <Button
              htmlType="button"
              type="primary"
              size="large"
              block
              loading={isGuestLoading}
              disabled={isSubmitting}
              onClick={handleGuestLogin}
              style={{
                height: 50,
                fontSize: "1.1rem",
                fontWeight: 800,
                border: "4px solid #1f2937",
                boxShadow: "0 5px 0 #b45309",
              }}
            >
              {t("guest")}
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
