"use client";

import { usePathname } from "next/navigation";

import { localeCookie, localeCookieMaxAge, localeMeta, locales } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { switchLocalePath } from "@/i18n/paths";

type LanguageSwitcherProps = {
  current: Locale;
  label: string;
  className?: string;
};

function savePreference(locale: Locale) {
  document.cookie = `${localeCookie}=${locale}; path=/; max-age=${localeCookieMaxAge}; samesite=lax`;
}

/**
 * BG · EN · ES · DE. Plain links (full page load, on purpose): switching the
 * root [locale] segment must re-render <html lang> and the root layout, which
 * client-side navigation does not guarantee with Cache Components.
 */
export function LanguageSwitcher({ current, label, className }: LanguageSwitcherProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className={className}>
      <ul className="flex items-center">
        {locales.map((locale, index) => (
          <li key={locale} className="flex items-center">
            {index > 0 ? (
              <span aria-hidden="true" className="text-ash">
                ·
              </span>
            ) : null}
            <a
              href={switchLocalePath(pathname, locale)}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === current ? "page" : undefined}
              onClick={() => savePreference(locale)}
              className="inline-flex min-h-11 min-w-9 items-center justify-center text-xs font-semibold tracking-[0.15em] text-ash transition-colors duration-fast hover:text-bone aria-[current=page]:text-bone aria-[current=page]:underline aria-[current=page]:decoration-royal-light aria-[current=page]:underline-offset-6"
            >
              {localeMeta[locale].label}
              <span className="sr-only"> {localeMeta[locale].endonym}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
