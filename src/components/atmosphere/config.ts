/** Ink atmosphere: per-route tiling. Art itself comes from pnpm backdrop:generate. */

export type BackdropRoute = "home" | "about" | "portfolio";

/** Color layers, bottom to top. */
export const BACKDROP_LAYERS = ["royal", "royal-light", "bone"] as const;

export type BackdropLayer = (typeof BACKDROP_LAYERS)[number];

/**
 * Tiles (~100vh each) rendered per route, covering the document height.
 * Unique sections cycle and are mirrored on each repeat. Tiles below the end
 * of the page are clipped and never painted, so their images never load.
 */
export const TILES_PER_ROUTE: Record<BackdropRoute, number> = {
  home: 4,
  about: 3,
  portfolio: 4,
};
