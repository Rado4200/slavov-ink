# Ink atmosphere (v2)

The background art: calligraphic brush strokes, fine spatter and an automatic
lightning storm, all on black. Decorative only (`aria-hidden`, no pointer
events), palette tokens only, and never below WCAG AA for body text.

Mood: hand-inked flash sheets and calligraphy practice sheets. Dry-brush ink,
sparse and intentional. Negative space matters.

## How it is built

```
scripts/backdrop/core.mjs        seeded generator (pure; shared with the playground)
scripts/generate-backdrop.mjs    CLI: pnpm backdrop:generate [--seed N] [--sheet out.png]
public/backdrop/tiles/*.avif     alpha masks: <route>-<section>-<d|m>-<layer>.avif
public/backdrop/storm.json       8 bolts (paths) + layer styles
public/backdrop/grain.webp       film grain tile
src/components/atmosphere/       Backdrop (tiles), LightningStorm + storm-engine, config
```

### Strokes

- **One nib.** Every stroke is a flat nib swept along a centerline at one
  global angle (`DEFAULTS.nibAngle`, 40°). Width therefore follows direction:
  thick when moving across the nib, hairline when moving along it.
  Rotation and mirroring are applied to the centerline _before_ the sweep, so
  the nib angle stays coherent.
- **Pressure.** Ink-pooled starts (a soft lozenge where the nib lands), tapered
  or dry lift-off ends.
- **Dry brush.** The nib is split into 9–24 bristle bands. Each band has its own
  ink supply, which runs out along the stroke. This gives streaks along the
  direction of travel, small gaps, thinning bristles and broken edges. The
  outer bristles carry less ink, so edges fray first. Outer edges also get
  multi-scale (3-octave) roughness.
- **Families** (desktop, per ~100vh tile):

  | Family                 | Count | Notes                                                                                                   |
  | ---------------------- | ----- | ------------------------------------------------------------------------------------------------------- |
  | long diagonals         | 3–5   | 18–62°, ≥ 60% of the diagonal, enter from edges/corners, clipped; quiet (far opacity, bone/violet only) |
  | hairline bundles       | 2–3   | 2–5 parallel hairlines moving along the nib                                                             |
  | medium arcs / S-curves | 8–12  | power-law sizes 120–380 px                                                                              |
  | short flicks / ticks   | 14–22 | 18–90 px                                                                                                |
  | hooks                  | 2–4   | lozenge head, thick downstroke, curl, diamond foot (logo blackletter)                                   |

  Mobile uses 45% of the density and draws elements about 60% as large.

- **Color mix:** bone ≈ 65%, royal ≈ 20%, royal-light ≈ 10%, violet-deep ≈ 5%.
  violet-deep is painted as royal at 29% alpha, which is identical over ink.
  Up to three large white strokes get the logo's offset violet **echo**
  (6–14 px down-right), never stronger than the stroke it shadows.
- **Opacity hierarchy:** far 0.05–0.10, mid 0.10–0.20, near 0.18–0.32. White is
  never above 0.32; the mix varies by family.

### Spatter

8–14 clusters per tile plus 40–80 isolated specks. Each cluster has 30–90
droplets whose density decays from an impact point along a fling direction.
Radii follow a power law from 0.6 to 5 px (rarely up to 9, never above 10).
About 15% of droplets are elongated with a tail. More than half the clusters
sit at stroke ends, as if thrown off by the pen. White ≈ 85%, purple ≈ 15%,
opacity buckets 0.15 / 0.25 / 0.4 / 0.6. Droplets merge into one path per
(color, opacity) bucket.

### Composition

- Seeded dart-throwing (jittered Poisson-disc) over an **edge-weighted** density
  field, multiplied by low-frequency 2D noise. The result is clusters and voids,
  never even spacing.
- Deterministic per route and section: `hashSeed(seed, route, section, variant)`.
  Home, about and portfolio share one look from different seeds.
- **Content column caps.** Where art overlaps the central column (desktop 24–76%
  of the width; mobile 5–95%), opacity is capped at bone 0.09, royal-light 0.22
  and royal 0.35, so body text stays at or above 4.5:1. The footer sits on an
  `ink/80` surface.
- Each tile's top and bottom 7% fade out, so strokes never end on a hard line
  at a tile seam.

### Why AVIF masks, not SVG

The dry-brush texture is thousands of small polygons per tile: 2–6 MB of SVG
path data. As inline SVG that would wreck HTML size and DOM; as external SVG,
decoding would cost far too much. So the generator builds the vector, renders it
with sharp, and stores **one alpha-only AVIF per color layer**:

- Texture costs bytes, not runtime. AVIF is about 2.5× smaller than WebP here
  (desktop tile ≈ 15 KB vs ≈ 40 KB).
- The page paints each layer as a **CSS mask** over a token color
  (`--bone`, `--royal-light`, `--royal`), so colors remain live design tokens.
- Masks are not LCP candidates and load at image priority. Tiles use
  `content-visibility: auto`, so off-screen tiles are not painted and their
  masks are not fetched until they come near the viewport.
- Desktop (1600×1000) tiles are used on landscape screens and mobile (720×1560)
  tiles on portrait screens; only the matching URL is ever requested.

### Page integration

`<Backdrop route="home" />` is the first child of a page. It positions against
the layout's `relative isolate` wrapper, so it spans main and footer. It renders
`TILES_PER_ROUTE` tiles of 100vh each (home 4, about 3, portfolio 4). The two
unique sections per route cycle, mirrored on each repeat. Parallax is CSS
scroll-driven (`animation-timeline: view()`), with layers at different depths,
on landscape ≥ 768 px only and never under reduced motion.

## Lightning storm

- `LightningStorm` (client) renders an empty fixed SVG layer behind all content.
  After `load` and idle, it imports `storm-engine.ts` and fetches `storm.json`.
  Nothing loads under `prefers-reduced-motion` or Save-Data.
- **Timing** (`storm.config.ts`, the single `STORM` object): first strike 7–12 s
  after idle, then every 14–38 s, × 1.6 on phones and touch devices. Paused
  while the tab is hidden.
- **Placement:** 7 horizontal slots drawn from a shuffle bag, never the same or
  an adjacent slot twice in a row. Random mirror, rotation ±12°, length
  30–75% of the viewport height, descending from the top edge.
- **Strike:** in 30 ms, dip, second pulse at 140 ms to 70%, fade 450–700 ms. Two
  pulses per strike, with strikes at least 14 s apart, is far below 3 flashes
  per second (WCAG 2.3.1). Optional royal wash at ≤ 5% alpha.
- **Look:** bone-white core with a royal-light surround made of stacked strokes
  (no blur), hairline and bold styles.
- **Text shields:** at each strike, text boxes near the bolt are cut out of its
  mask (bolt at 8% behind text), so body text stays at or above 4.5:1 even at
  peak.
- Imperative Web Animations API, no React state per strike, no animation library.
  `window.dispatchEvent(new Event("storm:strike"))` triggers one manually
  (playground, tests).

## Budgets (enforced)

| Budget                   | Limit                           | Current (seed 7)                                            | Enforced by                    |
| ------------------------ | ------------------------------- | ----------------------------------------------------------- | ------------------------------ |
| Total backdrop assets    | ≤ 220 KB                        | 136.2 KB                                                    | `pnpm backdrop:generate` fails |
| Mobile payload per route | ≤ 120 KB                        | 32–33 KB                                                    | `pnpm backdrop:generate` fails |
| Added DOM nodes per page | ≤ 60                            | 27–31                                                       | Playwright check               |
| Storm JS                 | ≤ 2 KB gzipped                  | ≈ 1.7 KB (1.3 KB engine, loaded after idle; ≈ 0.4 KB shell) | measured                       |
| LCP / CLS                | no regression                   | LCP is never a backdrop element; CLS 0                      | Playwright check               |
| Long tasks (4× CPU)      | none while scrolling / striking | 0 (24 strikes, 3 scroll runs)                               | Playwright check               |
| Body-text contrast       | ≥ 4.5:1 incl. peak flash        | worst 4.99:1 (7 frozen peak flashes per page, 390 and 1440) | Playwright pixel check         |

## Tuning

- `--backdrop-intensity` in `src/styles/tokens.css`: one knob for all tiles (0–1).
- `STORM` in `src/components/atmosphere/storm.config.ts`: intervals, slots,
  intensity, wash, shields.
- `DENSITY`, `DEPTH`, `SAFE_CAPS`, `DEFAULTS.nibAngle` in `scripts/backdrop/core.mjs`,
  then `pnpm backdrop:generate` (change `--seed` for a new arrangement).
- `/en/dev/backdrop`: seed, density, intensity, nib angle, per-family toggles,
  Trigger strike, 390 / 768 / 1440 presets and a safe-zone overlay.
