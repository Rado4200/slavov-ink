import { Cormorant, Manrope, Pirata_One } from "next/font/google";

/**
 * Site typefaces, self-hosted by next/font.
 * Exposed as CSS variables and mapped to Tailwind in src/app/globals.css:
 * font-display, font-heading, font-sans (body).
 *
 * Every @font-face carries a unicode-range, so browsers only download the
 * subsets a page actually uses (Cyrillic on /bg, Latin elsewhere).
 */

/** Blackletter. Latin only: use ONLY for text identical in every language. */
export const displayFont = Pirata_One({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
  variable: "--font-display-face",
});

export const headingFont = Cormorant({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  preload: false,
  variable: "--font-heading-face",
});

export const bodyFont = Manrope({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  variable: "--font-body-face",
});

export const fontVariables = [displayFont.variable, headingFont.variable, bodyFont.variable].join(
  " ",
);
