#!/usr/bin/env node
/**
 * Samples the brand palette from the logo raster.
 *
 * Usage: node scripts/extract-brand-colors.mjs [path/to/logo.png] [--json]
 *
 * Pipeline:
 *   1. Downsample (cheap, and averages out sub-pixel grain).
 *   2. Keep only "flat" pixels: all 4 neighbours within a small RGB distance.
 *      This drops anti-aliased edges (purple fading into black) and grunge speckle.
 *   3. Drop the near-black background.
 *   4. Split the rest into chromatic (purple) and neutral (white/grey) pixels.
 *   5. Purples: k-means in RGB, clusters ranked by population. The brightest
 *      dominant cluster is the royal purple, the darkest is the shadow violet.
 *   6. Neutrals: lightness percentiles describe the white -> grey range.
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const input =
  args.find((a) => !a.startsWith("--")) ?? path.join(root, "public/brand/logo-current.png");

const SAMPLE_WIDTH = 600;
const FLAT_DISTANCE = 28; // max RGB distance to every neighbour
const BLACK_MAX = 34; // max channel value treated as background
const K = 4;

const toHex = ([r, g, b]) =>
  "#" +
  [r, g, b]
    .map((v) => Math.round(v).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

function rgbToHsl([r, g, b]) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function kmeans(points, k, iterations = 30) {
  // Deterministic init: spread seeds across the lightness-sorted list.
  const sorted = [...points].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  let centroids = Array.from({ length: k }, (_, i) =>
    sorted[Math.floor(((i + 0.5) / k) * sorted.length)].slice(),
  );
  let assignment = new Array(points.length).fill(0);
  for (let it = 0; it < iterations; it++) {
    assignment = points.map((p) => {
      let best = 0;
      let bestD = Infinity;
      centroids.forEach((c, i) => {
        const d = dist(p, c);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    });
    const sums = centroids.map(() => [0, 0, 0, 0]);
    points.forEach((p, i) => {
      const s = sums[assignment[i]];
      s[0] += p[0];
      s[1] += p[1];
      s[2] += p[2];
      s[3] += 1;
    });
    centroids = sums.map((s, i) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centroids[i]));
  }
  const counts = centroids.map(() => 0);
  assignment.forEach((a) => counts[a]++);
  return centroids.map((c, i) => ({ rgb: c, count: counts[i] })).filter((c) => c.count > 0);
}

const { data, info } = await sharp(input)
  .removeAlpha()
  .resize({ width: SAMPLE_WIDTH })
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const px = (x, y) => {
  const i = (y * width + x) * channels;
  return [data[i], data[i + 1], data[i + 2]];
};

const purples = [];
const neutrals = [];
const background = [0, 0, 0];
let backgroundCount = 0;
let flat = 0;
let total = 0;

for (let y = 1; y < height - 1; y++) {
  for (let x = 1; x < width - 1; x++) {
    total++;
    const p = px(x, y);
    if (Math.max(...p) <= BLACK_MAX) {
      p.forEach((v, c) => (background[c] += v));
      backgroundCount++;
      continue;
    }
    const neighbours = [px(x - 1, y), px(x + 1, y), px(x, y - 1), px(x, y + 1)];
    if (neighbours.some((n) => dist(n, p) > FLAT_DISTANCE)) continue;
    flat++;
    const { h, s } = rgbToHsl(p);
    if (s >= 0.35 && h >= 240 && h <= 300) purples.push(p);
    else if (s <= 0.12) neutrals.push(p);
  }
}

if (purples.length === 0 || neutrals.length === 0) {
  process.stderr.write("Could not find purple and neutral regions.\n");
  process.exit(1);
}

const clusters = kmeans(purples, K)
  .map((c) => ({
    hex: toHex(c.rgb),
    share: c.count / purples.length,
    ...rgbToHsl(c.rgb),
  }))
  .sort((a, b) => b.share - a.share);

// Dominant clusters only (>= 10% of purple pixels), then pick by lightness.
const dominant = clusters.filter((c) => c.share >= 0.1);
const byLightness = [...dominant].sort((a, b) => b.l - a.l);
const royal = byLightness[0];
const violet = byLightness[byLightness.length - 1];

const neutralL = neutrals.map((p) => ({ p, l: rgbToHsl(p).l })).sort((a, b) => a.l - b.l);
const greyAt = (q) => {
  // Average the pixels in a 2% window around the percentile, for stability.
  const lo = Math.floor(Math.max(0, q - 0.01) * neutralL.length);
  const hi = Math.ceil(Math.min(1, q + 0.01) * neutralL.length);
  const slice = neutralL.slice(lo, Math.max(hi, lo + 1));
  const avg = [0, 1, 2].map((c) => slice.reduce((s, v) => s + v.p[c], 0) / slice.length);
  return toHex(avg);
};

const result = {
  source: path.relative(root, input).replaceAll("\\", "/"),
  sampled: {
    width,
    height,
    pixels: total,
    flat,
    purples: purples.length,
    neutrals: neutrals.length,
  },
  background: toHex(background.map((v) => v / Math.max(1, backgroundCount))),
  royalPurple: royal.hex,
  shadowViolet: violet.hex,
  purpleClusters: clusters.map((c) => ({
    hex: c.hex,
    share: Number(c.share.toFixed(3)),
    hue: Math.round(c.h),
    saturation: Number(c.s.toFixed(2)),
    lightness: Number(c.l.toFixed(2)),
  })),
  neutrals: {
    brightest: greyAt(0.98),
    p90: greyAt(0.9),
    median: greyAt(0.5),
    p10: greyAt(0.1),
    darkest: greyAt(0.02),
  },
};

if (asJson) {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
} else {
  const lines = [
    `Source: ${result.source} (sampled at ${width}x${height})`,
    `Flat pixels: ${flat} / ${total}  purple: ${purples.length}  neutral: ${neutrals.length}`,
    "",
    `Background (near-black average):    ${result.background}`,
    `Royal purple (dominant, brightest): ${result.royalPurple}`,
    `Shadow violet (dominant, darkest):  ${result.shadowViolet}`,
    "",
    "Purple clusters (by share):",
    ...result.purpleClusters.map(
      (c) =>
        `  ${c.hex}  ${(c.share * 100).toFixed(1).padStart(5)}%  h=${c.hue} s=${c.saturation} l=${c.lightness}`,
    ),
    "",
    "White / grey range (lightness percentiles):",
    ...Object.entries(result.neutrals).map(([k, v]) => `  ${k.padEnd(10)} ${v}`),
  ];
  process.stdout.write(lines.join("\n") + "\n");
}
