/**
 * Motion tokens for Motion (JS). Mirrors the --curve-* and --dur-* values in
 * src/styles/tokens.css; change both together.
 */
export const easing = {
  outExpo: [0.16, 1, 0.3, 1],
  outQuart: [0.25, 1, 0.5, 1],
  inOutQuint: [0.83, 0, 0.17, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** Seconds (Motion's unit). */
export const duration = {
  fast: 0.15,
  base: 0.3,
  slow: 0.6,
  slower: 1,
} as const;
