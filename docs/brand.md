# Slavov Ink brand

Source of truth for colour and logo usage. Generated from the current logo
(`public/brand/logo-current.png`, 1654 × 2339 px raster on black).
Final token values live in `src/styles/tokens.css`.

To re-sample after the logo changes:

```sh
pnpm brand:colors          # human-readable report
pnpm brand:colors --json   # machine-readable
```

The script (`scripts/extract-brand-colors.mjs`) downsamples the logo to 600 px wide,
keeps only "flat" pixels (all four neighbours within a small RGB distance, which
removes anti-aliased edges and grunge speckle), drops the near-black background,
then clusters the purples (k-means, k = 4) and takes lightness percentiles of the
white/grey areas.

## Sampled colours

| Token         | Hex       | Source                                 | Role                                 | Contrast on ink |
| ------------- | --------- | -------------------------------------- | ------------------------------------ | --------------- |
| `ink`         | `#000000` | Background average (`#000001`)         | Base background                      | n/a             |
| `royal`       | `#6904B4` | Brightest dominant purple (12.8 %)     | Primary accent: fills, borders, glow | 2.28:1          |
| `royal-deep`  | `#51038B` | Mid purple cluster (28.1 %)            | Offset echo, pressed states          | 1.74:1          |
| `violet`      | `#39055E` | Mid-dark purple cluster (26.1 %)       | Gradients, shadow tone               | 1.36:1          |
| `violet-deep` | `#1E0134` | Darkest dominant purple (33.0 %)       | Subtle surfaces, veil gradient       | 1.11:1          |
| `bone`        | `#FCFCFC` | White areas, 90th percentile lightness | Headings, high-emphasis text         | 20.47:1         |
| `silver`      | `#CFCFD0` | White areas, median lightness          | Body text                            | 13.49:1         |
| `ash`         | `#959595` | White areas, 10th percentile lightness | Secondary text, labels               | 7.01:1          |

All purples share one hue (≈ 275°, saturation 0.91 to 0.97). The four clusters
are shades of the same ink, produced by the grunge shading in the logo.

### Derived (not sampled)

| Token         | Hex       | Why                                                                                           | Contrast                             |
| ------------- | --------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `royal-light` | `#B451FB` | Same hue 275°, lightness raised to 65 %. Sampled `royal` fails WCAG for text and focus rings. | 5.51:1 on ink, 4.97:1 on violet-deep |
| `ink-raised`  | `#0A0A0A` | Neutral lift for cards (no hue).                                                              | n/a                                  |
| `ink-line`    | `#1A1A1A` | Hairline borders (no hue).                                                                    | n/a                                  |

### Colour rules

- `royal` is never used for readable text (2.28:1). Use `royal-light` for purple
  text, links and focus rings.
- Body text is `silver`; headings `bone`; secondary `ash`. All pass WCAG AA on
  `ink`, `ink-raised` and `violet-deep`.
- Gradients go purple to black only (`bg-veil`: `violet-deep` to `ink`).
- No hues outside this table. Tailwind's default palette is disabled
  (`--color-*: initial` in `src/app/globals.css`), so off-brand colours fail to compile
  into utilities.

## Logo structure

The lockup is a vertical rectangle (about 2 : 3) built from four parts:

1. **Monogram.** A large gothic blackletter **S** in grunge white, set inside a
   rectangular frame whose top and left edges are also white. The counters
   and the inside of the frame are filled with layered purple blackletter
   flourishes, shaded from `violet-deep` to `royal`.
2. **Vertical wordmark.** **SLAVOV** runs top to bottom along the right edge,
   one letter per line, in a flared, chiselled serif (capitals with a
   lowercase-style _a_). The first S has a small hooked swash.
3. **INK.** set along the bottom left in the same serif, white, with a **purple
   offset echo** (a copy in `royal-deep` set directly above, overlapping the S).
   The final V of SLAVOV shares the baseline with INK.
4. **Diamond accents.** Small white lozenges: one dotting the echo's _i_, one as
   the full stop after INK. They become the site's bullet and divider motif
   (`DiamondDivider`).

Texture: every white element is distressed (grunge scratches and mottling from
`#7F7F7F` to `#FFFFFF`). The site echoes this with a static film grain overlay
(`GrainOverlay`) and the offset purple echo (`text-shadow-echo`, `shadow-echo`).

## Usage rules

- **On black only.** The current file is a raster on a black canvas with no
  transparency. Place it on `ink`, or on very dark purple surfaces only
  (the component uses `mix-blend-mode: lighten` so the black canvas melts into
  dark surfaces). Never place it on light, photographic or busy backgrounds.
- **Clear space.** Keep empty space of at least **25 % of the lockup width**
  on all sides. No text, image edges or UI chrome inside that zone.
- **Minimum size.** 96 px tall for the full lockup, the size where the vertical
  SLAVOV letters stay readable. Below that, use the monogram (header: 40 px tall).
- **Do not** recolour, stretch, rotate, outline, add effects other than the
  token glow (the `glow` prop), or rebuild the lettering in a web font.
- **Single source.** Render the logo only through
  `src/components/brand/Logo.tsx` (`variant="full" | "monogram"`). See
  [TEMP assets](#temp-assets-to-be-replaced-by-the-artist) for replacing the files.

## TEMP assets (to be replaced by the artist)

The artist is reworking the logo into one unified brand. Until the final files
arrive, two TEMP rasters stand in:

| File                             | What                                                                | Used for                                      |
| -------------------------------- | ------------------------------------------------------------------- | --------------------------------------------- |
| `public/brand/logo-current.png`  | Original lockup on black (1654 × 2339)                              | `<Logo variant="full">`: home hero, footer    |
| `public/brand/monogram-temp.png` | **TEMP** crop of the S monogram with its frame, on black, 378 × 512 | `<Logo variant="monogram">`: header, favicons |

The monogram crop is source pixels x 350–1092, y 490–1495 of the lockup: the
frame plus the S, stopping above the purple INK echo and left of the SLAVOV
wordmark. It is 512 px tall, at least 2× its largest planned render (the
180 px Apple touch icon; the header uses 40 px).

**Replacing them:** drop the final SVG logo and vector monogram into
`public/brand/`, point the two imports in `src/components/brand/Logo.tsx` at
them and set each variant's crop to the full image, then run `pnpm brand:icons`.
No other component changes. Once both are vectors, the on-black-only rule and
the `mix-blend-mode: lighten` workaround can go.

## Typography (provisional)

Working pair, to be finalized after review in all four languages on `/en/dev/type`:

| Role                        | Font       | Subsets                    | Notes                                                                                               |
| --------------------------- | ---------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| Display (rare accents only) | Pirata One | latin, latin-ext           | **No Cyrillic.** Only for text identical in every language: the brand name, numerals (404), glyphs. |
| Headings                    | Cormorant  | latin, latin-ext, cyrillic | High-contrast serif, close to the SLAVOV serif.                                                     |
| Body                        | Manrope    | latin, latin-ext, cyrillic | Clean geometric sans, readable on black.                                                            |

All `@font-face` rules carry a `unicode-range`, so a page downloads only the
subsets it uses. Only Manrope is preloaded (body text is the inner pages' LCP);
Cormorant and Pirata One swap in. Verified with DevTools platform-font data:
every BG/EN/ES/DE sample glyph (ъ ь ю я щ, ñ ¿ ¡ á é í ó ú ü, ä ö ü ß)
renders in Cormorant/Manrope, with no fallback font.

## Ink atmosphere (background art)

Calligraphic brush strokes, ink splashes and one lightning bolt, generated
from a seed so the result is reproducible.

- **Generator:** `pnpm backdrop:generate [--seed N]` (core in
  `scripts/backdrop/core.mjs`, seeded mulberry32 RNG, no `Math.random`).
  - Strokes sweep a flat rectangular nib at a fixed 35–45° angle along Bézier
    centrelines, so thick/thin follows the stroke direction like a broad-edge
    pen. Rough edges and dry-brush bristle tails are baked into the geometry.
    Each step is a convex hull; all hulls are one `<path>` with nonzero fill.
  - Splashes: a noisy main blob with spikes thrown mostly in one direction,
    satellite droplets, bead trails and specks.
  - Lightning: midpoint displacement with 1–2 forks. Style A is a hairline,
    B has a visible glow. The glow is stacked wide, faint `royal-light`
    strokes, not a blur filter.
  - Output: `public/backdrop/*.svg` (used as CSS masks, so colour comes from
    tokens), `grain.webp` (pre-rendered film grain), and
    `src/components/atmosphere/backdrop-manifest.json`. The script fails if
    the total exceeds 150 KB (currently about 115 KB raw).
- **Composition:** `src/components/atmosphere/composition.ts` (hand-placed
  layers per variant, `home` / `inner`, fewer on narrow screens).
- **Tuning:** `--backdrop-intensity` in `tokens.css` (0–1) scales every layer;
  `HOME_LIGHTNING` in `Backdrop.tsx` picks A, B or none. Compare everything
  on `/en/dev/backdrop`.
- **Rules:** decorative only (`aria-hidden`, no pointer events). Palette
  tokens only. Bone layers at ≤ 0.1 opacity and purples at ≤ 0.35 keep text
  above AA (measured worst case 12.5:1). Motion is transform/opacity only:
  desktop parallax via CSS scroll-driven animations (no JS), and one soft
  2-pulse lightning flash per session. Both are off under
  `prefers-reduced-motion`.

## Open questions for the rework

- A vector (SVG) logo and monogram with transparent backgrounds would remove
  the on-black restriction and shrink the files (currently 555 KB + 203 KB).
- A simplified mark for the favicon at 16–32 px (the TEMP monogram is busy at
  that size).
