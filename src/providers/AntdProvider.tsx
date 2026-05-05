"use client";

import { ConfigProvider, App as AntdApp } from "antd";
import type { ReactNode } from "react";

const theme = {
  token: {
    colorPrimary: "#f97316",
    colorPrimaryHover: "#ea580c",
    colorPrimaryActive: "#c2410c",
    colorLink: "#c2410c",
    colorLinkHover: "#f97316",
    borderRadius: 12,
    fontFamily:
      "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  components: {
    Button: {
      controlHeight: 44,
      controlHeightLG: 56,
      fontWeight: 700,
      primaryShadow: "0 4px 0 #b45309",
    },
  },
};

export default function AntdProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={theme}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
