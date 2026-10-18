import type { Metadata } from "next";

import { localeMeta, locales } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { languageAlternates, localizedPath } from "@/i18n/paths";
import { site } from "@/content/site";

type PageMetadataInput = {
  locale: Locale;
  /** Locale-neutral path, e.g. "/" or "/about". */
  path: string;
  title: string;
  description: string;
  /** Use the title as-is, skipping the "%s | Slavov Ink" template. */
  absoluteTitle?: boolean;
};

export function pageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: localizedPath(locale, path),
      languages: languageAlternates(path),
    },
    // Page-level openGraph replaces the layout one entirely, so repeat shared fields.
    openGraph: {
      type: "website",
      siteName: site.name,
      title,
      description,
      url: localizedPath(locale, path),
      locale: localeMeta[locale].ogLocale,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeMeta[l].ogLocale),
    },
  };
}
