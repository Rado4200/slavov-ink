# Ink atmosphere (v3)

The background art: a few clean calligraphic brush strokes, fine dust and an
automatic lightning storm, all on black. Decorative only (`aria-hidden`, no
pointer events), palette tokens only, and never below WCAG AA for text, even at
the peak of a strike.

Mood: hand-inked flash sheets and calligraphy practice sheets. Sparse and
intentional; negative space matters. v3 replaces v2's dense strokes and spatter
with fewer, cleaner strokes and an even dust field.

## How it is built

```
scripts/backdrop/core.mjs        seeded generator (pure; shared with the playground)
scripts/generate-backdrop.mjs    CLI: pnpm backdrop:generate [--seed N] [--sheet out.png]
public/backdrop/tiles/*.avif     section masks: <route>-<section>-<d|m>-<layer>.avif
public/backdrop/tiles/*-hero-*.avif  draw-on long diagonals (Home, About, first tile)
public/backdrop/dust-*.avif      page-wide dust masks (2 depths x 2 colours, d|m)
public/backdrop/contact-*.avif   contact tile behind the glass panel
public/backdrop/storm.json       8 bolts (paths only; looks live in storm.config.ts)
public/backdrop/grain.webp       film grain tile (glass panel)
src/components/atmosphere/       Backdrop, ContactBackdrop, Dust, LightningStorm,
                                 storm-engine, storm.config, config, backdrop.css
src/components/motion/Effects.tsx  decode-then-fade and reveal observer
```

### Strokes

- **One nib.** Every stroke is a flat nib swept along a centerline at one
  global angle (`DEFAULTS.nibAngle`, 40°): thick across the nib, hairline along
  it. Rotation and mirroring happen before the sweep, so the angle stays
  coherent.
- **Cleaner dry brush.** 6–14 bristle bands (v2: 9–24), lower edge roughness.
  Long diagonals get a pressure swell, a tapered start and a slight bow (±5%).
- **Families** (desktop, per ~100lvh tile; phones use 55% of the count):

  | Family           | Count | Notes                                                      |
  | ---------------- | ----- | ---------------------------------------------------------- |
  | long diagonals   | 2–3   | edge to edge, hero opacity 0.24–0.40; drawn on (see below) |
  | hairline bundles | 1–2   | 2–5 parallel hairlines along the nib                       |
  | medium arcs      | 3–5   | power-law sizes                                            |
  | short flicks     | 4–8   | small accents                                              |

- **Overlap rule.** Strokes keep a clearance of at least 5% of the tile width
  from each other; at most one long × medium crossing per tile. A placement
  that breaks the rule is rerolled (up to 40 attempts per element).
- **Opacity:** far 0.05–0.10, mid 0.10–0.20, near 0.18–0.32, hero 0.24–0.40.
  White is never above 0.32 outside the hero diagonals and never above 0.40.
  Large white strokes keep the logo's offset violet echo.

### Dust (replaces spatter)

Page-wide, on one fixed viewport layer rather than per tile, so density is
constant at every scroll position and costs four masks instead of one per tile.

- Poisson-disc (blue-noise) acceptance with ≥ 28 CSS px spacing, modulated
  ±40% by smooth noise: everywhere, never a grid.
- 140–220 particles on desktop (161 at seed 7), 60–100 on phones (97).
- Radii 0.4–2.4 px (95%), up to 4 px (5%); about 10% slightly elongated.
- 65% bone, 35% purple; opacity buckets 0.12 to 0.70.
- Two depth layers (far: royal + bone, near: royal-light + bone) drift very
  slowly in CSS: far −10/8 px over 110 s, near 14/−10 px over 90 s (alternate).
  Off under reduced motion.

### Contact tile

Behind the glass contact panel on Home: two bold strokes with a royal echo and
a dust band, kept to the panel edges (desktop 27% / 73% of the width, phones
4% / 96%), and clamped to the content-column caps like every other mask.

### Composition and the content column

- Seeded and deterministic per route and section: `hashSeed(seed, route,
section, variant)`.
- **Content-column caps.** Where art overlaps the column that holds text
  (desktop 24–76% of the width; phones the full width), every mask pixel is
  clamped per layer to bone 0.05, royal-light 0.12 and royal 0.30, with a 10%
  ramp at the column edges. The budget is sized for the worst case: silver body
  text at 4.5:1 while a lightning core passes behind it at the 25% shield floor.
- Each tile's top and bottom 7% fade out, so strokes never end on a hard seam.

### Seeds (base seed 7)

For each route the generator scores 5 candidate seeds (0.4 clearance + 0.3
balance + 0.3 density fit) and pins the best. The other 4 stay available.

| Route     | Pinned (score)  | Other candidates (score)                                           |
| --------- | --------------- | ------------------------------------------------------------------ |
| home      | 1754441210 (64) | 1771218829 (64), 1653775496 (64), 1737663591 (62), 1720885972 (60) |
| about     | 1222593690 (65) | 1205816071 (63), 1189038452 (61), 1155483214 (61), 1239371309 (60) |
| portfolio | 1563363545 (67) | 1546585926 (66), 1596918783 (63), 1529808307 (62), 1513030688 (59) |

To switch, change the route's pinned seed in `scripts/generate-backdrop.mjs` or
preview any of them in `/en/dev/backdrop`.

### Why AVIF masks, not SVG

The brush texture is thousands of small polygons per tile (megabytes of path
data). The generator renders it with sharp and stores **one alpha-only AVIF per
colour layer**. The page paints each layer as a **CSS mask** over a token
colour (`--bone`, `--royal-light`, `--royal`), so colours stay live tokens.
Masks are never LCP candidates. Tiles use `content-visibility: auto`, so
off-screen masks are not fetched until needed. Desktop (1600×1000) tiles serve
landscape screens and mobile (720×1560) tiles portrait ones; a layer missing for
one variant is hidden there (`data-d` / `data-m`), never painted unmasked.

### Page integration and motion

- `<Backdrop route="home" />` is the first child of a page and spans main and
  footer: home 3 tiles, about 2, portfolio 3, each 100lvh; the two unique
  sections cycle, mirrored on repeat.
- **Fade-in:** layers start at opacity 0 and fade in over 1200 ms once
  `Effects` has decoded their masks (`data-ready`); no pop-in of half-decoded art.
- **Draw-on:** on Home and About, the 2–3 long diagonals of the first tile are
  drawn once, 1.1–1.6 s each (by length), 150 ms stagger. Compositor-only: a
  rotated clip window translates along the stroke while the stroke inside is
  counter-translated, so its edge travels from start to end (no clip-path or
  mask animation, no repaint).
- **Parallax:** CSS scroll-driven (`animation-timeline: view()`), layers at
  different depths, landscape ≥ 768 px only.

## Lightning storm

- `LightningStorm` (client) renders a fixed layer behind all content: a royal
  wash plus two SVGs (bright strike, purple afterglow). After `load` and idle it
  imports `storm-engine.ts` (lazy chunk) and fetches `storm.json`. Nothing loads
  under Save-Data.
- **Timing** (`STORM` in `storm.config.ts`): first strike 4–6 s after idle, then
  every 9–22 s; intervals × 1.3 on phones and touch devices. Paused while the
  tab is hidden.
- **Placement:** 7 horizontal slots from a shuffle bag, never the same or an
  adjacent slot twice in a row; random mirror, rotation ±12°.
- **Strike timeline:** full in 30 ms, dip to 35% at 90 ms, second pulse to 75%
  at 140 ms, then a 550 ms fade that cross-fades into the purple afterglow
  (peak 60%); gone at about 1.1 s. Royal wash ≤ 5%. Two pulses per strike and
  strikes ≥ 9 s apart: far below 3 flashes per second (WCAG 2.3.1).
- **Look:** bone core at full opacity, 3 px (2.5 px on phones), surrounded by
  stacked royal-light strokes 6 / 14 / 30 px at 0.5 / 0.25 / 0.12 (no blur).
  Bold and hairline styles alternate across the 8 bolts.
- **Text shields:** at each strike, every text box near the bolt (paragraphs,
  labels, inputs, links, buttons and headings) becomes a dimmed area of the
  bolt's mask: the bolt keeps 25% there. Spec start was 40%; measured, 40% and
  30% fail body text once art, dust and bolt overlap, so 25%, the allowed
  minimum. Headings are shielded too: unshielded, the bolt core takes large text
  to 1:1 at peak (owner decision, Phase 2C).
- Web Animations API with per-keyframe offsets, no React state per strike.
  `window.dispatchEvent(new Event("storm:strike"))` triggers one manually.

## Reduced motion and review aid

| Effect           | Default                  | `prefers-reduced-motion: reduce`                   |
| ---------------- | ------------------------ | -------------------------------------------------- |
| Lightning        | full strike every 9–22 s | gentle: one slow fade to 60%, 1.6 s, every 30–60 s |
| Draw-on          | 1.1–1.6 s per diagonal   | off (strokes shown complete)                       |
| Backdrop fade-in | 1200 ms after decode     | off (shown at once)                                |
| Dust drift       | 90–110 s alternate       | off                                                |
| Parallax         | landscape ≥ 768 px       | off                                                |
| Save-Data        | no storm                 | no storm                                           |

`?effects=full` on any URL sets `html[data-effects="full"]` for the session and
restores every effect under reduced motion, for reviewing recordings.

## Budgets (enforced)

| Budget                   | Limit              | Current (seed 7)                                     | Enforced by                    |
| ------------------------ | ------------------ | ---------------------------------------------------- | ------------------------------ |
| Total backdrop assets    | ≤ 240 KB           | 93.2 KB                                              | `pnpm backdrop:generate` fails |
| Phone payload per route  | ≤ 140 KB           | 29.6–32.9 KB                                         | `pnpm backdrop:generate` fails |
| Added DOM nodes per page | ≤ 60               | 42–54                                                | Playwright check               |
| Storm JS                 | ≤ 2.5 KB gzipped   | 1.4 KB engine (lazy, after idle) + small shell       | measured                       |
| LCP / CLS                | no regression      | LCP never a backdrop element; CLS ≤ 0.001            | Playwright check               |
| Body text at peak        | ≥ 4.5:1            | worst 4.95:1 (7 frozen peaks per page, 390 and 1440) | Playwright pixel check         |
| Large text at peak       | ≥ 3:1              | worst pixel 7.41:1                                   | Playwright pixel check         |
| First strike             | visible within 8 s | 6.2 s (1440), 7.0 s (390) after navigation           | Playwright check               |

Asset breakdown: section tiles 10–14 KB desktop per route, dust 7.5 KB, contact
9.3 KB, storm.json 12.5 KB, grain 7.0 KB.

## Tuning

- `--backdrop-intensity` in `src/styles/tokens.css`: one knob for all art (0–1).
- `STORM` in `src/components/atmosphere/storm.config.ts`: timing, slots, looks,
  wash, shields, gentle mode.
- `DENSITY`, `CLEARANCE`, `SAFE_CAPS`, `DUST`, `DEFAULTS.nibAngle` in
  `scripts/backdrop/core.mjs`, then `pnpm backdrop:generate`.
- `/en/dev/backdrop` (dev only): candidate seeds and custom seed, stroke and
  particle density, particle size, intensity, nib angle, family toggles,
  viewport presets, contact preview, safe-zone overlay, Trigger strike.
