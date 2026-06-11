import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";

import { AuthProvider } from "@/context/AuthContext";
import { defaultTheme, isTheme, themeCookieName } from "@/lib/theme";
import AntdProvider from "@/providers/AntdProvider";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(themeCookieName)?.value;
  const theme = isTheme(themeCookie) ? themeCookie : defaultTheme;

  return (
    <html lang={locale} data-theme={theme}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AntdProvider>
            <AuthProvider>{children}</AuthProvider>
          </AntdProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
