#!/usr/bin/env node
/**
 * Generates the ink atmosphere (v2) from a seed.
 *
 * Usage: pnpm backdrop:generate [--seed N] [--sheet path/to/contact-sheet.png]
 *        (default seed: the one in the manifest)
 *
 * Per route and ~100vh section, one tile per variant (desktop landscape,
 * mobile portrait) is composed in vector, rasterized, and saved as one
 * alpha-only AVIF mask per color layer (royal, royal-light, bone). The page
 * paints them as CSS masks over token colors, so:
 *   - dry-brush texture costs bytes, not DOM nodes or runtime filters;
 *   - colors stay live design tokens;
 *   - masks are never LCP candidates.
 *
 * Outputs
 *   public/backdrop/tiles/<route>-<section>-<d|m>-<layer>.avif
 *   public/backdrop/storm.json      lightning bolts (inline SVG paths)
 *   public/backdrop/grain.webp      film-grain tile
 *   src/components/atmosphere/backdrop-manifest.json
 *
 * Fails when a budget is exceeded: total <= 220 KB, mobile payload per
 * route <= 120 KB.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import {
  FAMILIES,
  LAYERS,
  TILES,
  composeTile,
  createRng,
  familySample,
  generateStorm,
  hashSeed,
  spatterSample,
  tileLayersToSvg,
} from "./backdrop/core.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "public/backdrop");
const manifestPath = path.join(root, "src/components/atmosphere/backdrop-manifest.json");

/** Unique sections per route; longer pages cycle them (mirrored). */
const ROUTES = { home: 2, about: 2, portfolio: 2 };
const BUDGET = { total: 220 * 1024, mobilePerRoute: 120 * 1024 };
const AVIF = { quality: 50, effort: 6 };
const GRAIN_SIZE = 128;

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function readSeed() {
  const raw = argValue("--seed");
  if (raw !== undefined) {
    const value = Number.parseInt(raw, 10);
    if (!Number.isInteger(value) || value < 0) {
      process.stderr.write("--seed must be a non-negative integer\n");
      process.exit(1);
    }
    return value;
  }
  if (fs.existsSync(manifestPath)) return JSON.parse(fs.readFileSync(manifestPath, "utf8")).seed;
  return 7;
}

/** Fraction of the tile height over which art fades out at the top and bottom. */
const FEATHER = 0.07;

async function alphaMask(svg, width, height) {
  const alpha = await sharp(Buffer.from(svg)).ensureAlpha().extractChannel(3).raw().toBuffer();
  // Feather the top and bottom edges so strokes never end in a hard line at tile seams.
  const band = FEATHER * height;
  for (let y = 0; y < height; y++) {
    const t = Math.min(1, Math.min(y, height - 1 - y) / band);
    const f = t * t * (3 - 2 * t);
    if (f >= 1) continue;
    for (let x = 0, i = y * width; x < width; x++, i++) alpha[i] = Math.round(alpha[i] * f);
  }
  const mask = await sharp({ create: { width, height, channels: 3, background: "#000" } })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .avif(AVIF)
    .toBuffer();
  return mask;
}

async function writeGrain(seed) {
  const rng = createRng(seed ^ 0x9e3779b9);
  const pixels = Buffer.alloc(GRAIN_SIZE * GRAIN_SIZE * 4);
  for (let i = 0; i < GRAIN_SIZE * GRAIN_SIZE; i++) {
    pixels.fill(255, i * 4, i * 4 + 3);
    pixels[i * 4 + 3] = Math.floor(rng() * 256);
  }
  const file = path.join(outDir, "grain.webp");
  await sharp(pixels, { raw: { width: GRAIN_SIZE, height: GRAIN_SIZE, channels: 4 } })
    .webp({ quality: 60, alphaQuality: 45, effort: 6 })
    .toFile(file);
  return fs.statSync(file).size;
}

async function writeContactSheet(seed, file) {
  const cell = { width: 360, height: 260 };
  const cols = 6;
  const rows = [...FAMILIES, "spatter"];
  const pad = 36;
  const width = cell.width * cols;
  const height = rows.length * (cell.height + pad);
  let body = `<rect width="100%" height="100%" fill="#000"/>`;
  rows.forEach((family, r) => {
    const y = r * (cell.height + pad);
    body += `<text x="12" y="${y + 24}" fill="#959595" font-family="sans-serif" font-size="16" letter-spacing="3">${family.toUpperCase()}</text>`;
    for (let c = 0; c < cols; c++) {
      const sampleSeed = hashSeed(seed, "sheet", family, c);
      const d =
        family === "spatter"
          ? spatterSample(sampleSeed, cell)
          : familySample(sampleSeed, family, cell);
      const fill = c % 3 === 2 ? "#b451fb" : "#fcfcfc";
      const clip = `c${r}-${c}`;
      body += `<clipPath id="${clip}"><rect width="${cell.width}" height="${cell.height}"/></clipPath><g transform="translate(${c * cell.width} ${y + pad})"><g clip-path="url(#${clip})"><path fill="${fill}" fill-opacity="0.85" d="${d}"/></g><rect width="${cell.width}" height="${cell.height}" fill="none" stroke="#1a1a1a"/></g>`;
    }
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
  process.stdout.write(`contact sheet: ${path.relative(root, file)}\n`);
}

const seed = readSeed();
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "tiles"), { recursive: true });

const sizes = new Map();
const routes = {};
for (const [route, sections] of Object.entries(ROUTES)) {
  routes[route] = [];
  for (let section = 0; section < sections; section++) {
    const entry = {};
    for (const variant of Object.keys(TILES)) {
      const tile = composeTile(hashSeed(seed, route, section, variant), { variant });
      const svgs = tileLayersToSvg(tile);
      entry[variant] = {};
      for (const layer of LAYERS) {
        if (!svgs[layer]) {
          entry[variant][layer] = null;
          continue;
        }
        const name = `${route}-${section}-${variant[0]}-${layer}.avif`;
        const buffer = await alphaMask(svgs[layer], tile.width, tile.height);
        fs.writeFileSync(path.join(outDir, "tiles", name), buffer);
        sizes.set(name, buffer.length);
        entry[variant][layer] = `/backdrop/tiles/${name}`;
      }
    }
    routes[route].push(entry);
    process.stdout.write(`${route} section ${section}: done\n`);
  }
}

const storm = generateStorm(hashSeed(seed, "storm"));
const stormJson = JSON.stringify(storm);
fs.writeFileSync(path.join(outDir, "storm.json"), stormJson);
const grainBytes = await writeGrain(seed);

const manifest = {
  seed,
  format: "avif",
  tiles: Object.fromEntries(
    Object.entries(TILES).map(([variant, t]) => [variant, { width: t.width, height: t.height }]),
  ),
  routes,
  storm: "/backdrop/storm.json",
  grain: { file: "/backdrop/grain.webp", size: GRAIN_SIZE },
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

// Budgets.
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const shared = stormJson.length + grainBytes;
const total = [...sizes.values()].reduce((a, b) => a + b, 0) + shared;
let failed = false;
process.stdout.write(`\nseed ${seed}\n`);
for (const route of Object.keys(ROUTES)) {
  const sum = (variant) =>
    [...sizes.entries()]
      .filter(([name]) => name.startsWith(`${route}-`) && name.includes(`-${variant}-`))
      .reduce((a, [, b]) => a + b, 0);
  const mobile = sum("m") + shared;
  process.stdout.write(
    `${route.padEnd(10)} desktop tiles ${kb(sum("d")).padStart(9)}   mobile payload ${kb(mobile).padStart(9)} / ${kb(BUDGET.mobilePerRoute)}\n`,
  );
  if (mobile > BUDGET.mobilePerRoute) failed = true;
}
process.stdout.write(`storm.json ${kb(stormJson.length)}, grain ${kb(grainBytes)}\n`);
process.stdout.write(`TOTAL ${kb(total)} / ${kb(BUDGET.total)}\n`);
if (total > BUDGET.total) failed = true;

const sheet = argValue("--sheet");
if (sheet) await writeContactSheet(seed, path.resolve(sheet));

if (failed) {
  process.stderr.write("Backdrop budget exceeded.\n");
  process.exit(1);
}
