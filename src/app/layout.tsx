import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthProvider } from "@/context/AuthContext";
import AntdProvider from "@/providers/AntdProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AntdProvider>
          <AuthProvider>{children}</AuthProvider>
        </AntdProvider>
      </body>
    </html>
  );
}
