"use client";

import { ConfigProvider, App as AntdApp, theme as antdTheme } from "antd";
import { useEffect, useState, type ReactNode } from "react";

import { defaultTheme, type Theme } from "@/lib/theme";

const sharedToken = {
  colorPrimary: "#f97316",
  colorPrimaryHover: "#ea580c",
  colorPrimaryActive: "#c2410c",
  colorLink: "#c2410c",
  colorLinkHover: "#f97316",
  borderRadius: 12,
  fontFamily:
    "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// Tokens sobrescritos no dark — mantem coerencia com as CSS vars de globals.css.
const darkToken = {
  colorBgContainer: "#1f2937",
  colorBgElevated: "#1a1a1a",
  colorBgLayout: "#0a0a0a",
  colorBorder: "#334155",
  colorBorderSecondary: "#1f2937",
  colorText: "#f8fafc",
  colorTextSecondary: "#e2e8f0",
  colorTextTertiary: "#94a3b8",
  colorTextQuaternary: "#64748b",
};

const buttonComponent = {
  Button: {
    controlHeight: 44,
    controlHeightLG: 56,
    fontWeight: 700,
    primaryShadow: "0 4px 0 #b45309",
  },
};

export default function AntdProvider({ children }: { children: ReactNode }) {
  // Estado inicial = defaultTheme; o useEffect abaixo sincroniza com o
  // `data-theme` que o layout server-side ja escreveu no <html>.
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const root = document.documentElement;

    const readTheme = (): Theme => {
      const t = root.dataset.theme as Theme | undefined;
      return t === "light" || t === "dark" ? t : defaultTheme;
    };

    // Sincroniza com o tema atual (vindo do SSR via cookie). Usa functional
    // update para evitar render desnecessario quando o valor ja bate. O lint
    // `react-hooks/set-state-in-effect` reclama de setState sincrono em effect,
    // mas aqui e intencional: precisamos ler o data-theme escrito server-side
    // depois da hidratacao.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentTheme((prev) => {
      const next = readTheme();
      return prev === next ? prev : next;
    });

    // Observa o ThemeSwitcher (que faz setAttribute em data-theme) em runtime.
    const observer = new MutationObserver(() => {
      setCurrentTheme((prev) => {
        const next = readTheme();
        return prev === next ? prev : next;
      });
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const isDark = currentTheme === "dark";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
        token: {
          ...sharedToken,
          ...(isDark ? darkToken : {}),
        },
        components: buttonComponent,
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
