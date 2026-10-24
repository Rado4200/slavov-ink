/** Ink atmosphere: per-route tiling. Art itself comes from pnpm backdrop:generate. */

export type BackdropRoute = "home" | "about" | "portfolio";

/** Color layers, bottom to top. */
export const BACKDROP_LAYERS = ["royal", "royal-light", "bone"] as const;

export type BackdropLayer = (typeof BACKDROP_LAYERS)[number];

/**
 * Tiles (~100lvh each) rendered per route, covering the document height.
 * Unique sections cycle and are mirrored on each repeat. Tiles below the end
 * of the page are clipped and never painted, so their images never load.
 */
export const TILES_PER_ROUTE: Record<BackdropRoute, number> = {
  home: 3,
  about: 2,
  portfolio: 3,
};

/** Draw-on: the clip window is the tile scaled by this factor (covers any rotation). */
export const DRAW_SCALE = 2.8;

/** Draw-on timing: duration grows with stroke length; strokes start 150 ms apart. */
export const DRAW = { minMs: 1100, maxMs: 1600, staggerMs: 150 };
