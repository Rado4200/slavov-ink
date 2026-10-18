import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";
import { languageAlternates, localizedPath } from "@/i18n/paths";
import { getSiteUrl } from "@/lib/site-url";

/** Locale-neutral paths of every public page. */
const PAGES = ["/", "/about", "/portfolio"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const absolute = (path: string) => new URL(path, base).toString();

  return PAGES.flatMap((page) => {
    const languages = Object.fromEntries(
      Object.entries(languageAlternates(page)).map(([lang, path]) => [lang, absolute(path)]),
    );
    return locales.map((locale) => ({
      url: absolute(localizedPath(locale, page)),
      alternates: { languages },
    }));
  });
}
