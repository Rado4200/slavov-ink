import { Cormorant, Manrope, Pirata_One } from "next/font/google";

/**
 * Site typefaces, self-hosted by next/font.
 * Exposed as CSS variables and mapped to Tailwind in src/app/globals.css:
 * font-display (rare blackletter accents), font-heading, font-sans (body).
 */
export const displayFont = Pirata_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-face",
});

export const headingFont = Cormorant({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading-face",
});

export const bodyFont = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body-face",
});

export const fontVariables = [displayFont.variable, headingFont.variable, bodyFont.variable].join(
  " ",
);
