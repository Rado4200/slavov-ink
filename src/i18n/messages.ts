import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";

import { isLocale } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import bg from "@/messages/bg";
import de from "@/messages/de";
import en from "@/messages/en";
import type { Messages } from "@/messages/en";
import es from "@/messages/es";

/*
 * Server-side message access. `next/root-params` reads the [locale] segment from
 * anywhere on the server (and fails the build if imported by a Client Component),
 * so messages never reach the client bundle; pass resolved strings as props.
 */
const dictionaries: Record<Locale, Messages> = { bg, en, es, de };

export type { Messages };

export async function getLocale(): Promise<Locale> {
  const value = await localeParam();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getMessages(): Promise<Messages> {
  return dictionaries[await getLocale()];
}

export function getMessagesFor(locale: Locale): Messages {
  return dictionaries[locale];
}

/** Replaces {placeholders}: format("© {year}", { year: 2026 }) -> "© 2026". */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
