// Types for core.mjs, so the /dev/backdrop playground can import it under strict TS.

export type Rng = () => number;

export type Family = "long" | "bundle" | "medium" | "short" | "hook";
export type FamilyOrSpatter = Family | "spatter";
export type Layer = "royal" | "royal-light" | "bone";
export type Variant = "desktop" | "mobile";

export type TileElement = { layer: Layer; alpha: number; d: string; family: string };

export type Tile = {
  width: number;
  height: number;
  safe: [number, number];
  elements: TileElement[];
};

export type ComposeOptions = {
  variant?: Variant;
  nibAngle?: number;
  density?: number;
  families?: Set<FamilyOrSpatter>;
};

export type BoltLayer = {
  part: "all" | "main" | "forks";
  width: number;
  color: "bone" | "royal-light";
  opacity: number;
};

export type BoltStyle = "hairline" | "bold";

export type Bolt = {
  style: BoltStyle;
  width: number;
  height: number;
  length: number;
  main: string;
  forks: string;
};

export type Storm = { styles: Record<BoltStyle, BoltLayer[]>; bolts: Bolt[] };

export const FAMILIES: Family[];
export const LAYERS: Layer[];
export const TILES: Record<
  Variant,
  { width: number; height: number; scale: number; safe: [number, number]; edgePower: number }
>;
export const DEFAULTS: { nibAngle: number; density: number };
export const SAFE_CAPS: Record<Layer, number>;

export function createRng(seed: number): Rng;
export function hashSeed(...parts: Array<string | number>): number;
export function composeTile(seed: number, options?: ComposeOptions): Tile;
export function tileLayersToSvg(tile: Tile): Record<Layer, string | null>;
export function generateStorm(seed: number, count?: number): Storm;
export function familySample(
  seed: number,
  family: Family,
  cell: { width: number; height: number },
  nibAngle?: number,
): string;
export function spatterSample(seed: number, cell: { width: number; height: number }): string;
