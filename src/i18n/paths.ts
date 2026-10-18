import { defaultLocale, isLocale, locales } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

/** "/about" + "bg" -> "/bg/about"; "/" + "bg" -> "/bg". */
export function localizedPath(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Swaps the locale segment of a pathname, keeping the rest of the path. */
export function switchLocalePath(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) {
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
  }
  return localizedPath(locale, pathname);
}

/** hreflang map for metadata and the sitemap, including x-default. */
export function languageAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, localizedPath(locale, path)])),
    "x-default": localizedPath(defaultLocale, path),
  };
}
