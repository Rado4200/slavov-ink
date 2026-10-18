import type { Metadata } from "next";

import { site } from "@/content/site";
import { defaultLocale, localeMeta, locales } from "@/i18n/config";
import { getMessagesFor } from "@/i18n/messages";
import { localizedPath } from "@/i18n/paths";
import { fontVariables } from "@/styles/fonts";

import "./globals.css";

/*
 * Last-resort 404 for URLs that match no route at all (normally the proxy
 * redirects those into a locale, where [locale]/not-found renders). There is
 * no locale here, so it uses the default locale and offers every language.
 */
const m = getMessagesFor(defaultLocale);

export const metadata: Metadata = {
  title: `${m.notFound.metaTitle} | ${site.name}`,
};

export default function GlobalNotFound() {
  return (
    <html lang={defaultLocale} className={fontVariables}>
      <body className="flex min-h-dvh flex-col items-center justify-center bg-ink bg-veil px-gutter text-center text-silver">
        <p
          aria-hidden="true"
          className="font-display text-8xl text-bone text-shadow-echo sm:text-9xl"
        >
          {m.notFound.code}
        </p>
        <h1 className="mt-6 font-heading text-4xl font-medium text-bone">{m.notFound.heading}</h1>
        <p className="mt-6">{m.notFound.body}</p>
        <ul className="mt-10 flex gap-6">
          {locales.map((locale) => (
            <li key={locale}>
              <a
                href={localizedPath(locale, "/")}
                lang={locale}
                hrefLang={locale}
                className="inline-flex min-h-11 items-center text-sm font-semibold tracking-[0.15em] text-bone"
              >
                {localeMeta[locale].label}
                <span className="sr-only"> {localeMeta[locale].endonym}</span>
              </a>
            </li>
          ))}
        </ul>
      </body>
    </html>
  );
}
