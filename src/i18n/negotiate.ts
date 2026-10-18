import { defaultLocale, isLocale } from "@/i18n/config";
import type { Locale } from "@/i18n/config";

/**
 * Picks the best supported locale from an Accept-Language header.
 * Matches on the primary language subtag ("de-AT" -> "de"), honours q-values,
 * and falls back to the default locale.
 */
export function negotiateLocale(header: string | null): Locale {
  if (!header) return defaultLocale;

  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const quality = q ? Number.parseFloat(q.slice(2)) : 1;
      return {
        language: tag.toLowerCase().split("-")[0],
        quality: Number.isNaN(quality) ? 0 : quality,
        index,
      };
    })
    .filter((entry) => entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  const match = ranked.find((entry) => isLocale(entry.language))?.language;
  return isLocale(match) ? match : defaultLocale;
}
