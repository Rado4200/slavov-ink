import {
  Fraunces,
  Grenze_Gotisch,
  Inter,
  Playfair_Display,
  UnifrakturCook,
} from "next/font/google";

import { bodyFont, displayFont, headingFont } from "@/styles/fonts";

// Loaded only by the /dev/type route, so they never ship with real pages.
// Each uses every subset it offers out of latin, latin-ext and cyrillic.
const unifraktur = UnifrakturCook({ weight: "700", subsets: ["latin"], preload: false });
const grenze = Grenze_Gotisch({ subsets: ["latin", "latin-ext"], preload: false });
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext", "cyrillic"],
  preload: false,
});
const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], preload: false });
const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], preload: false });

export type FontCandidate = {
  name: string;
  family: string;
  current: boolean;
  /** Whether the family ships Cyrillic glyphs (needed for BG). */
  cyrillic: boolean;
};

const candidate = (
  name: string,
  font: { style: { fontFamily: string } },
  cyrillic: boolean,
  current = false,
): FontCandidate => ({ name, family: font.style.fontFamily, cyrillic, current });

export const displayCandidates: FontCandidate[] = [
  candidate("Pirata One", displayFont, false, true),
  candidate("UnifrakturCook", unifraktur, false),
  candidate("Grenze Gotisch", grenze, false),
];

export const headingCandidates: FontCandidate[] = [
  candidate("Playfair Display", playfair, true),
  candidate("Cormorant", headingFont, true, true),
  candidate("Fraunces", fraunces, false),
];

export const bodyCandidates: FontCandidate[] = [
  candidate("Inter", inter, true),
  candidate("Manrope", bodyFont, true, true),
];
