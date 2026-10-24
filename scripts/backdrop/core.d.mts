// Types for core.mjs (v3), so the /dev/backdrop playground can import it under strict TS.

export type Rng = () => number;
export type Family = "long" | "bundle" | "medium" | "short";
export type Layer = "royal" | "royal-light" | "bone";
export type Variant = "desktop" | "mobile";
export type DustLayer = "far-royal" | "far-bone" | "near-royal-light" | "near-bone";

export type TileElement = { layer: Layer; alpha: number; d: string; family: string };
export type Hero = {
  layer: Layer;
  alpha: number;
  d: string;
  angle: number;
  start: [number, number];
  end: [number, number];
};

export type TileStats = {
  counts: Record<Family, number>;
  want: Record<Family, number>;
  minClearance: number;
  crossings: number;
  balance: number;
  attempts: number;
};

export type Tile = {
  width: number;
  height: number;
  safe: [number, number];
  elements: TileElement[];
  heroes: Hero[];
  stats: TileStats;
};

export type Score = { clearance: number; balance: number; density: number; total: number };

export type Dust = {
  width: number;
  height: number;
  safe: [number, number];
  layers: Record<DustLayer, Array<{ alpha: number; d: string }>>;
  count: number;
};

export type ContactTile = {
  width: number;
  height: number;
  elements: Array<{ layer: Layer; alpha: number; d: string }>;
};

export const FAMILIES: Family[];
export const LAYERS: Layer[];
export const DUST_LAYERS: DustLayer[];
export const SAFE_CAPS: Record<Layer, number>;
export const CLEARANCE: number;
export const DEFAULTS: {
  nibAngle: number;
  density: number;
  particleDensity: number;
  particleSize: number;
};
export const TILES: Record<
  Variant,
  { width: number; height: number; cssPx: number; safe: [number, number]; edgePower: number }
>;

export function createRng(seed: number): Rng;
export function hashSeed(...parts: Array<string | number>): number;
export function composeTile(
  seed: number,
  options?: {
    variant?: Variant;
    nibAngle?: number;
    density?: number;
    families?: Set<Family>;
    hero?: boolean;
  },
): Tile;
export function scoreTile(tile: Tile): Score;
export function composeDust(
  seed: number,
  options?: { variant?: Variant; density?: number; size?: number },
): Dust;
export function composeContactTile(
  seed: number,
  options?: { variant?: Variant; nibAngle?: number },
): ContactTile;
export function clampSafeZone(
  alpha: Uint8Array,
  width: number,
  height: number,
  safe: [number, number],
  cap: number,
): void;
export function pathsToSvg(
  width: number,
  height: number,
  paths: Array<{ alpha: number; d: string }>,
): string;
