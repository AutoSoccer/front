import type { Metadata } from "next";

import { AuthProvider } from "@/context/AuthContext";
import AntdProvider from "@/providers/AntdProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoSoccer",
  description: "Monte sua equipe e dispute o campeonato no AutoSoccer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AntdProvider>
          <AuthProvider>{children}</AuthProvider>
        </AntdProvider>
      </body>
    </html>
  );
}
