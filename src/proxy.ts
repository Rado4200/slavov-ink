import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isLocale, localeCookie } from "@/i18n/config";
import { negotiateLocale } from "@/i18n/negotiate";

/**
 * Redirects locale-less URLs ("/", "/about") to their localized version.
 * Priority: saved switcher choice (cookie) > Accept-Language > default locale.
 * Locale-prefixed pages never reach this function (see matcher), so they stay
 * fully static.
 */
export function proxy(request: NextRequest) {
  const saved = request.cookies.get(localeCookie)?.value;
  const locale = isLocale(saved) ? saved : negotiateLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = url.pathname === "/" ? `/${locale}` : `/${locale}${url.pathname}`;

  const response = NextResponse.redirect(url, 307);
  response.headers.set("Vary", "Accept-Language, Cookie");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  // Everything except: locale-prefixed paths, Next internals, and files with an
  // extension (icons, sitemap.xml, robots.txt, public/ assets).
  // Must be a literal; keep the locale list in sync with src/i18n/config.ts
  // (checked by `pnpm i18n:check`).
  matcher: ["/((?!(?:bg|en|es|de)(?:/|$)|_next/|api/|.*\\..*).*)"],
};
