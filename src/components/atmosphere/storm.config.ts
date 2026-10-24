/**
 * Lightning storm: every tunable in one place (times in ms, angles in degrees).
 *
 * Strike: pop in to full in 30 ms, dip to 35% at 90 ms, second pulse to 75% at
 * 140 ms, then a 550 ms fade during which the bolt cross-fades into its purple
 * afterglow (core bone -> royal-light, surround royal-light -> royal); gone by
 * ~1.1 s. Two pulses per strike, strikes >= 9 s apart: far below 3 flashes/s.
 */
export const STORM = {
  /** Written by pnpm backdrop:generate (bolt geometry only). */
  src: "/backdrop/storm.json",
  /** Horizontal slots; never the same or an adjacent slot twice in a row. */
  slots: 7,
  /** After load + idle (always after LCP). */
  firstStrikeMs: [4000, 6000],
  intervalMs: [9000, 22000],
  /** Interval multiplier on phones / touch devices (not the first strike). */
  phoneFactor: 1.3,
  maxRotation: 12,
  timeline: {
    riseMs: 30,
    dipMs: 90,
    dip: 0.35,
    secondMs: 140,
    second: 0.75,
    fadeMs: 550,
    /** Purple afterglow peak (fraction of full) and when it is fully gone. */
    afterglow: 0.6,
    goneMs: 1100,
  },
  /** Ambient royal wash at the first peak (keep <= 0.05). */
  washAlpha: 0.05,
  /**
   * Bolt looks (stacked strokes, no blur). Width in CSS px; `phoneWidth` on
   * phones. `part`: which path the layer strokes. Two colour sets: `bright`
   * (strike) and `afterglow` (purple fade).
   */
  styles: {
    bold: {
      bright: [
        { part: "all", width: 30, color: "royal-light", opacity: 0.12 },
        { part: "all", width: 14, color: "royal-light", opacity: 0.25 },
        { part: "all", width: 6, color: "royal-light", opacity: 0.5 },
        { part: "main", width: 3, phoneWidth: 2.5, color: "bone", opacity: 1 },
        { part: "forks", width: 2, phoneWidth: 1.75, color: "bone", opacity: 1 },
      ],
      afterglow: [
        { part: "all", width: 30, color: "royal", opacity: 0.12 },
        { part: "all", width: 14, color: "royal", opacity: 0.25 },
        { part: "all", width: 6, color: "royal", opacity: 0.5 },
        { part: "main", width: 3, phoneWidth: 2.5, color: "royal-light", opacity: 1 },
        { part: "forks", width: 2, phoneWidth: 1.75, color: "royal-light", opacity: 1 },
      ],
    },
    hairline: {
      bright: [
        { part: "all", width: 20, color: "royal-light", opacity: 0.1 },
        { part: "all", width: 9, color: "royal-light", opacity: 0.22 },
        { part: "all", width: 4, color: "royal-light", opacity: 0.45 },
        { part: "main", width: 2, phoneWidth: 1.75, color: "bone", opacity: 1 },
        { part: "forks", width: 1.25, phoneWidth: 1.1, color: "bone", opacity: 1 },
      ],
      afterglow: [
        { part: "all", width: 20, color: "royal", opacity: 0.1 },
        { part: "all", width: 9, color: "royal", opacity: 0.22 },
        { part: "all", width: 4, color: "royal", opacity: 0.45 },
        { part: "main", width: 2, phoneWidth: 1.75, color: "royal-light", opacity: 1 },
        { part: "forks", width: 1.25, phoneWidth: 1.1, color: "royal-light", opacity: 1 },
      ],
    },
  },
  /**
   * Text the bolt passes behind (paragraphs, labels, inputs, links, buttons and
   * headings; not images or empty space) keeps `shieldFloor` of the bolt. Spec:
   * start at 40%, lower until body text holds 4.5:1 at peak, never below 25%.
   * Measured with the art at full strength: 40% fails, 30% passes on Home but
   * fails once art, dust and bolt overlap; so 25% (the minimum), with the art
   * budget in the content column sized around it (see SAFE_CAPS in
   * scripts/backdrop/core.mjs). Headings are shielded too (owner decision,
   * Phase 2C): unshielded, the bolt core drops large text to 1:1 at peak.
   */
  shieldSelector: ":is(main, footer, header) :is(p, label, input, textarea, a, button, h1, h2, h3)",
  shieldFloor: 0.25,
  shieldPadding: 8,
  /** Reduced motion: one slow fade (no pulse, no flicker) every 30-60 s. */
  gentle: { peak: 0.6, durationMs: 1600, intervalMs: [30000, 60000] },
} as const;

export type StormConfig = typeof STORM;
