/*
 * TEMPORARY design-review tool for the ink atmosphere. REMOVE BEFORE LAUNCH
 * (see docs/launch-checklist.md). The .dev.tsx extension keeps it out of
 * production builds; see next.config.ts.
 */
import type { Metadata } from "next";

import manifest from "@/components/atmosphere/backdrop-manifest.json";

import { BackdropPlayground } from "./BackdropPlayground";
import type { SeedOption } from "./BackdropPlayground";

export const metadata: Metadata = {
  title: "Backdrop playground (dev)",
  robots: { index: false, follow: false },
};

export default function BackdropPlaygroundPage() {
  const seeds: SeedOption[] = Object.entries(manifest.routes).flatMap(([route, r]) =>
    r.candidates.map((c) => ({
      route,
      seed: c.seed,
      pinned: c.seed === r.seed,
      score: `${c.total} (clearance ${c.clearance}, balance ${c.balance}, density ${c.density})`,
    })),
  );
  return <BackdropPlayground baseSeed={manifest.seed} seeds={seeds} />;
}
