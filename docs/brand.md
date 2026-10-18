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
  SLAVOV letters stay readable. 48 px tall is allowed only as the header home
  link, where the link carries an accessible name. Below 48 px, do not use it
  (a simplified mark is needed; see open questions).
- **Do not** recolour, stretch, rotate, outline, add effects other than the
  token glow (`variant="glow"`), or rebuild the lettering in a web font.
- **Single source.** Render the logo only through
  `src/components/brand/Logo.tsx`. To replace it: drop the new file in
  `public/brand/`, update the import and `LOGO_CROP` in that component, then
  run `pnpm brand:icons` (favicon and Apple touch icon are generated from the
  logo file) and `pnpm brand:colors`.

## Typography (provisional)

Chosen in Phase 1, pending review on the temporary `/dev/type` route:

| Role                        | Font       | Notes                                            |
| --------------------------- | ---------- | ------------------------------------------------ |
| Display (rare accents only) | Pirata One | Blackletter echoing the monogram. Hero/404 only. |
| Headings                    | Cormorant  | High-contrast serif, close to the SLAVOV serif.  |
| Body                        | Manrope    | Clean geometric sans, readable on black.         |

## Open questions for the rework

- A vector (SVG) version with a transparent background would remove the
  on-black restriction and shrink the file from 555 KB.
- A simplified mark (monogram only, no wordmark) for favicon and sizes below
  48 px.
