import {
  Fraunces,
  Grenze_Gotisch,
  Inter,
  Playfair_Display,
  UnifrakturCook,
} from "next/font/google";

import { bodyFont, displayFont, headingFont } from "@/styles/fonts";

// Loaded only by the /dev/type route, so they never ship with real pages.
const unifraktur = UnifrakturCook({ weight: "700", subsets: ["latin"], preload: false });
const grenze = Grenze_Gotisch({ subsets: ["latin"], preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], preload: false });
const fraunces = Fraunces({ subsets: ["latin"], preload: false });
const inter = Inter({ subsets: ["latin"], preload: false });

export type FontCandidate = {
  name: string;
  family: string;
  current: boolean;
};

const candidate = (name: string, font: { style: { fontFamily: string } }, current = false) => ({
  name,
  family: font.style.fontFamily,
  current,
});

export const displayCandidates: FontCandidate[] = [
  candidate("Pirata One", displayFont, true),
  candidate("UnifrakturCook", unifraktur),
  candidate("Grenze Gotisch", grenze),
];

export const headingCandidates: FontCandidate[] = [
  candidate("Playfair Display", playfair),
  candidate("Cormorant", headingFont, true),
  candidate("Fraunces", fraunces),
];

export const bodyCandidates: FontCandidate[] = [
  candidate("Inter", inter),
  candidate("Manrope", bodyFont, true),
];
