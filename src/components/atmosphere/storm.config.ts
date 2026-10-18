/**
 * Lightning storm: every tunable in one place. Times in ms, angles in degrees.
 * Strike shape: rise to full in riseMs, dip, second pulse (at secondPulseMs,
 * to secondPulse of full), then fade. Two pulses per strike and strikes at
 * least 14 s apart keep it far below 3 flashes per second (WCAG 2.3.1).
 */
export const STORM = {
  /** Written by pnpm backdrop:generate. */
  src: "/backdrop/storm.json",
  /** Horizontal slots across the viewport; never the same or an adjacent slot twice in a row. */
  slots: 7,
  /** First strike after the page is loaded and idle. */
  firstStrikeMs: [7000, 12000],
  intervalMs: [14000, 38000],
  /** Interval multiplier on phones / touch devices. */
  mobileFactor: 1.6,
  riseMs: 30,
  secondPulseMs: 140,
  secondPulse: 0.7,
  fadeMs: [450, 700],
  maxRotation: 12,
  /** Peak bolt opacity, 0-1. */
  intensity: 1,
  /** Ambient royal wash at peak (keep <= 0.05). */
  washAlpha: 0.05,
  /** Text the bolt passes behind is shielded (bolt dimmed to 8% there). */
  shieldSelector:
    "main :is(h1, h2, h3, h4, p, li, a, figcaption, blockquote), footer :is(h2, p, li, a)",
  shieldPadding: 8,
  shieldOpacity: 0.92,
} as const;

export type StormConfig = typeof STORM;
