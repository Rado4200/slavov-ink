import { Manrope, Pirata_One, Playfair_Display } from "next/font/google";

/**
 * Site typefaces, self-hosted by next/font (automatic fallback metrics, so the
 * swap from fallback to web font causes no layout shift).
 * Exposed as CSS variables and mapped to Tailwind in src/app/globals.css:
 * font-display (404 numerals only), font-heading, font-sans (body).
 *
 * Nothing is preloaded: the Home LCP is the logo image, and on inner pages the
 * LCP text paints first in the metric-matched fallback (display: swap).
 * Every @font-face has a unicode-range, so pages fetch only the subsets they use.
 */

/** Blackletter, Latin only: used ONLY for the 404 numerals. */
export const displayFont = Pirata_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-display-face",
});

/** Headings: high-contrast serif, variable weight (H1 800, H2/H3 700). */
export const headingFont = Playfair_Display({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  preload: false,
  variable: "--font-heading-face",
});

export const bodyFont = Manrope({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  preload: false,
  variable: "--font-body-face",
});

export const fontVariables = [displayFont.variable, headingFont.variable, bodyFont.variable].join(
  " ",
);
