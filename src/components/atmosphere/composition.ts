import type { StrokeKind } from "../../../scripts/backdrop/core.mjs";

/*
 * Hand-placed layers for each backdrop variant. Positions and widths are
 * percentages of the backdrop box (the page section it sits behind).
 * Opacity guide (subtle defaults, AA-safe over text): white (bone) <= 0.1, purples <= 0.35;
 * the global --backdrop-intensity token scales everything.
 */

export type BackdropVariant = "home" | "inner";

export type LayerColor = "bone" | "royal" | "royal-deep" | "violet";

export type ArtRef = { type: "stroke"; kind: StrokeKind } | { type: "splash"; index: number };

export type LayerSpec = {
  art: ArtRef;
  x: number;
  y: number;
  /** Width as % of the box, clamped to [minWidth, maxWidth] px. */
  width: number;
  minWidth: number;
  maxWidth: number;
  rotate: number;
  flip?: boolean;
  opacity: number;
  color: LayerColor;
  /** Parallax depth, 0 (still) to 1 (moves most). Desktop only. */
  depth: number;
  /** Hidden when the box is narrower than 768px. */
  desktopOnly?: boolean;
};

const stroke = (kind: StrokeKind): ArtRef => ({ type: "stroke", kind });
const splash = (index: number): ArtRef => ({ type: "splash", index });

export const compositions: Record<BackdropVariant, LayerSpec[]> = {
  home: [
    {
      art: stroke("arc"),
      x: 3,
      y: 9,
      width: 17,
      minWidth: 92,
      maxWidth: 270,
      rotate: -14,
      opacity: 0.09,
      color: "bone",
      depth: 0.25,
    },
    {
      art: stroke("swash"),
      x: 72,
      y: 62,
      width: 20,
      minWidth: 110,
      maxWidth: 300,
      rotate: 9,
      opacity: 0.3,
      color: "royal",
      depth: 0.55,
    },
    {
      art: splash(0),
      x: 84,
      y: 76,
      width: 11,
      minWidth: 70,
      maxWidth: 170,
      rotate: 0,
      opacity: 0.08,
      color: "bone",
      depth: 0.45,
      desktopOnly: true,
    },
    {
      art: stroke("slash"),
      x: 10,
      y: 66,
      width: 10,
      minWidth: 64,
      maxWidth: 150,
      rotate: 6,
      opacity: 0.08,
      color: "bone",
      depth: 0.75,
    },
    {
      art: splash(2),
      x: 5,
      y: 38,
      width: 9,
      minWidth: 60,
      maxWidth: 130,
      rotate: 140,
      opacity: 0.32,
      color: "royal",
      depth: 0.4,
      desktopOnly: true,
    },
    {
      art: stroke("hook"),
      x: 60,
      y: 56,
      width: 7,
      minWidth: 48,
      maxWidth: 110,
      rotate: -8,
      opacity: 0.35,
      color: "royal-deep",
      depth: 0.3,
      desktopOnly: true,
    },
    {
      art: stroke("flick"),
      x: 30,
      y: 4,
      width: 7,
      minWidth: 48,
      maxWidth: 110,
      rotate: 12,
      flip: true,
      opacity: 0.07,
      color: "bone",
      depth: 0.6,
      desktopOnly: true,
    },
  ],
  inner: [
    {
      art: stroke("comma"),
      x: 4,
      y: 12,
      width: 9,
      minWidth: 56,
      maxWidth: 140,
      rotate: -6,
      opacity: 0.08,
      color: "bone",
      depth: 0.3,
    },
    {
      art: stroke("arc"),
      x: 76,
      y: 58,
      width: 15,
      minWidth: 90,
      maxWidth: 230,
      rotate: 172,
      opacity: 0.3,
      color: "royal",
      depth: 0.5,
    },
    {
      art: splash(3),
      x: 86,
      y: 8,
      width: 8,
      minWidth: 54,
      maxWidth: 120,
      rotate: 30,
      opacity: 0.07,
      color: "bone",
      depth: 0.4,
      desktopOnly: true,
    },
    {
      art: stroke("flick"),
      x: 14,
      y: 70,
      width: 7,
      minWidth: 44,
      maxWidth: 100,
      rotate: -4,
      opacity: 0.45,
      color: "violet",
      depth: 0.65,
      desktopOnly: true,
    },
  ],
};
