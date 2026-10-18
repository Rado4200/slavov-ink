// Types for core.mjs, so the /dev/backdrop playground can import it under strict TS.

export type Rng = () => number;

export type StrokeKind = "arc" | "flick" | "slash" | "hook" | "swash" | "comma";

export type Shape = { d: string; width: number; height: number };

export type TokenColor = "bone" | "royal-light";

export type LightningLayer = {
  d: string;
  /** CSS px, rendered with vector-effect: non-scaling-stroke. */
  strokeWidth: number;
  color: TokenColor;
  opacity: number;
};

export type LightningStyle = "A" | "B";

export type Lightning = {
  width: number;
  height: number;
  styles: Record<LightningStyle, LightningLayer[]>;
};

export type BackdropSet = {
  seed: number;
  strokes: Array<Shape & { kind: StrokeKind }>;
  splashes: Shape[];
  lightning: Lightning;
};

export function createRng(seed: number): Rng;
export function generateStroke(rng: Rng, kind: StrokeKind): Shape & { kind: StrokeKind };
export function generateSplash(rng: Rng): Shape;
export function generateLightning(rng: Rng): Lightning;
export function generateSet(seed: number): BackdropSet;

export const STROKE_ORDER: StrokeKind[];
export const SPLASH_COUNT: number;
