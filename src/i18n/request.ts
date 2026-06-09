import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import type { Locale } from "@/i18n/config";
import {
  defaultLocale,
  isLocale,
  locales,
  localeCookieName,
} from "@/i18n/config";
import { loadMessages } from "@/i18n/messages";

function pickFromAcceptLanguage(headerValue: string | null): Locale | null {
  if (!headerValue) return null;
  const entries = headerValue
    .split(",")
    .map((part) => {
      const [tagRaw, qRaw] = part.trim().split(";");
      const tag = tagRaw?.trim();
      if (!tag) return null;
      const q = qRaw ? Number.parseFloat(qRaw.replace(/q=/i, "")) : 1;
      return { tag, q: Number.isFinite(q) ? q : 1 };
    })
    .filter((entry): entry is { tag: string; q: number } => entry !== null)
    .sort((a, b) => b.q - a.q);

  for (const entry of entries) {
    const candidate = entry.tag;
    if (isLocale(candidate)) {
      return candidate;
    }
    const language = candidate.split("-")[0]?.toLowerCase();
    for (const locale of locales) {
      if (locale.toLowerCase().startsWith(language ?? "")) {
        return locale;
      }
    }
  }
  return null;
}

export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  const negotiated = pickFromAcceptLanguage(acceptLanguage);
  if (negotiated) {
    return negotiated;
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  const messages = await loadMessages(locale);
  return {
    locale,
    messages,
  };
});
