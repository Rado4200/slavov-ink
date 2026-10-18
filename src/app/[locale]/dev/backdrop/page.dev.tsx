/*
 * TEMPORARY design-review tool for the ink atmosphere. REMOVE BEFORE LAUNCH
 * (delete src/app/[locale]/dev/backdrop/ once the backdrop is final).
 * The .dev.tsx extension keeps it out of production builds; see next.config.ts.
 */
import type { Metadata } from "next";

import manifest from "@/components/atmosphere/backdrop-manifest.json";

import { BackdropPlayground } from "./BackdropPlayground";

export const metadata: Metadata = {
  title: "Backdrop playground (dev)",
  robots: { index: false, follow: false },
};

export default function BackdropPlaygroundPage() {
  return <BackdropPlayground initialSeed={manifest.seed} />;
}
