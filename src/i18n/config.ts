/**
 * Locale configuration: the single place to add a locale or change the default.
 * When adding a locale, also update the matcher in src/proxy.ts (it must be a
 * static literal); `pnpm i18n:check` verifies the two stay in sync.
 */
export const locales = ["bg", "en", "es", "de"] as const;

export type Locale = (typeof locales)[number];

/** Fallback for unsupported browser languages, and the x-default hreflang. */
export const defaultLocale: Locale = "en";

/** Cookie storing an explicit choice made in the language switcher. */
export const localeCookie = "locale";

export const localeCookieMaxAge = 60 * 60 * 24 * 365;

/** Language-neutral labels: each language is named in its own language. */
export const localeMeta: Record<Locale, { label: string; endonym: string; ogLocale: string }> = {
  bg: { label: "BG", endonym: "Български", ogLocale: "bg_BG" },
  en: { label: "EN", endonym: "English", ogLocale: "en_US" },
  es: { label: "ES", endonym: "Español", ogLocale: "es_ES" },
  de: { label: "DE", endonym: "Deutsch", ogLocale: "de_DE" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}
