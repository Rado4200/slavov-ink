#!/usr/bin/env node
/**
 * Generates the ink atmosphere (v3).
 *
 * Usage: pnpm backdrop:generate [--seed N] [--sheet path/to/contact-sheet.png]
 *        (default base seed: the one in the manifest)
 *
 * Per route, 5 candidate seeds are composed and scored (clearance, balance,
 * density); the best is pinned. Each ~100vh section is rendered per variant
 * (desktop landscape, mobile portrait) as alpha-only AVIF masks per color
 * layer, painted by CSS over palette tokens (never LCP candidates). Home and
 * About export their long diagonals separately so they can draw on.
 *
 * Outputs
 *   public/backdrop/tiles/<route>-<section>-<d|m>-<layer>.avif
 *   public/backdrop/tiles/<route>-0-<d|m>-hero-<i>.avif   (draw-on diagonals)
 *   public/backdrop/dust-<d|m>-<layer>.avif                (page-wide particles)
 *   public/backdrop/contact-<d|m>-<layer>.avif             (behind the glass panel)
 *   public/backdrop/storm.json, public/backdrop/grain.webp
 *   src/components/atmosphere/backdrop-manifest.json
 *
 * Fails when a budget is exceeded: total <= 240 KB, phone payload per route <= 140 KB.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import {
  DUST_LAYERS,
  FAMILIES,
  LAYERS,
  SAFE_CAPS,
  TILES,
  clampSafeZone,
  composeContactTile,
  composeDust,
  composeTile,
  createRng,
  dustSample,
  familySample,
  generateStorm,
  hashSeed,
  pathsToSvg,
  scoreTile,
} from "./backdrop/core.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "public/backdrop");
const manifestPath = path.join(root, "src/components/atmosphere/backdrop-manifest.json");

/** Unique sections per route (longer pages cycle them, mirrored) and draw-on. */
const ROUTES = {
  home: { sections: 2, hero: true },
  about: { sections: 2, hero: true },
  portfolio: { sections: 2, hero: false },
};
const CANDIDATES = 5;
const BUDGET = { total: 240 * 1024, phonePerRoute: 140 * 1024 };
const AVIF = { quality: 50, effort: 6 };
const GRAIN_SIZE = 128;
const FEATHER = 0.07;
const VARIANTS = ["desktop", "mobile"];

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

const colorOf = (layer) =>
  layer.endsWith("royal-light") ? "royal-light" : layer.endsWith("royal") ? "royal" : "bone";

/** Rasterizes paths to an alpha-only AVIF mask, clamped in the content column. */
async function mask(width, height, paths, { safe, cap, feather = true }) {
  const alpha = await sharp(Buffer.from(pathsToSvg(width, height, paths)))
    .ensureAlpha()
    .extractChannel(3)
    .raw()
    .toBuffer();
  if (safe) clampSafeZone(alpha, width, height, safe, cap);
  if (feather) {
    const band = FEATHER * height;
    for (let y = 0; y < height; y++) {
      const t = Math.min(1, Math.min(y, height - 1 - y) / band);
      const f = t * t * (3 - 2 * t);
      if (f >= 1) continue;
      for (let x = 0, i = y * width; x < width; x++, i++) alpha[i] = Math.round(alpha[i] * f);
    }
  }
  return sharp({ create: { width, height, channels: 3, background: "#000" } })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .avif(AVIF)
    .toBuffer();
}

const sizes = new Map();
function save(relative, buffer) {
  fs.writeFileSync(path.join(outDir, relative), buffer);
  sizes.set(relative, buffer.length);
  return `/backdrop/${relative.replaceAll("\\", "/")}`;
}

async function writeGrain(seed) {
  const rng = createRng(seed ^ 0x9e3779b9);
  const pixels = Buffer.alloc(GRAIN_SIZE * GRAIN_SIZE * 4);
  for (let i = 0; i < GRAIN_SIZE * GRAIN_SIZE; i++) {
    pixels.fill(255, i * 4, i * 4 + 3);
    pixels[i * 4 + 3] = Math.floor(rng() * 256);
  }
  const buffer = await sharp(pixels, {
    raw: { width: GRAIN_SIZE, height: GRAIN_SIZE, channels: 4 },
  })
    .webp({ quality: 60, alphaQuality: 45, effort: 6 })
    .toBuffer();
  return save("grain.webp", buffer);
}

async function writeContactSheet(seed, file) {
  const cell = { width: 360, height: 260 };
  const cols = 6;
  const rows = [...FAMILIES, "dust"];
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
        family === "dust" ? dustSample(sampleSeed, cell) : familySample(sampleSeed, family, cell);
      const fill = c % 3 === 2 ? "#b451fb" : "#fcfcfc";
      const clip = `c${r}-${c}`;
      body += `<clipPath id="${clip}"><rect width="${cell.width}" height="${cell.height}"/></clipPath><g transform="translate(${c * cell.width} ${y + pad})"><g clip-path="url(#${clip})"><path fill="${fill}" fill-opacity="0.85" d="${d}"/></g><rect width="${cell.width}" height="${cell.height}" fill="none" stroke="#1a1a1a"/></g>`;
    }
  });
  await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`,
    ),
  )
    .png()
    .toFile(file);
  process.stdout.write(`contact sheet: ${path.relative(root, file)}\n`);
}

const seed = readSeed();
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "tiles"), { recursive: true });

// 1. Pick the best of 5 candidate seeds per route.
const routes = {};
for (const [route, cfg] of Object.entries(ROUTES)) {
  const candidates = [];
  for (let k = 0; k < CANDIDATES; k++) {
    const candidateSeed = hashSeed(seed, route, "candidate", k);
    const scores = [];
    for (let section = 0; section < cfg.sections; section++) {
      for (const variant of VARIANTS) {
        scores.push(
          scoreTile(
            composeTile(hashSeed(candidateSeed, section, variant), {
              variant,
              hero: cfg.hero && section === 0,
            }),
          ),
        );
      }
    }
    const avg = (key) => Math.round(scores.reduce((sum, s) => sum + s[key], 0) / scores.length);
    candidates.push({
      seed: candidateSeed,
      clearance: avg("clearance"),
      balance: avg("balance"),
      density: avg("density"),
      total: avg("total"),
    });
  }
  candidates.sort((a, b) => b.total - a.total);
  routes[route] = { seed: candidates[0].seed, candidates, sections: [] };
  process.stdout.write(
    `${route}: pinned ${candidates[0].seed} (score ${candidates[0].total}); others ${candidates
      .slice(1)
      .map((c) => `${c.seed}:${c.total}`)
      .join(", ")}\n`,
  );
}

// 2. Render the pinned compositions.
for (const [route, cfg] of Object.entries(ROUTES)) {
  for (let section = 0; section < cfg.sections; section++) {
    const entry = {};
    for (const variant of VARIANTS) {
      const t = TILES[variant];
      const tile = composeTile(hashSeed(routes[route].seed, section, variant), {
        variant,
        hero: cfg.hero && section === 0,
      });
      const layers = {};
      for (const layer of LAYERS) {
        const paths = tile.elements.filter((e) => e.layer === layer);
        layers[layer] = paths.length
          ? save(
              `tiles/${route}-${section}-${variant[0]}-${layer}.avif`,
              await mask(t.width, t.height, paths, { safe: t.safe, cap: SAFE_CAPS[layer] }),
            )
          : null;
      }
      const heroes = [];
      for (const [i, hero] of tile.heroes.entries()) {
        const url = save(
          `tiles/${route}-${section}-${variant[0]}-hero-${i}.avif`,
          await mask(t.width, t.height, [hero], { safe: t.safe, cap: SAFE_CAPS[hero.layer] }),
        );
        // Draw-on geometry: direction and start/end projections from the tile centre (tile px).
        const ux = Math.cos(hero.angle);
        const uy = Math.sin(hero.angle);
        const proj = ([x, y]) => Math.round((x - t.width / 2) * ux + (y - t.height / 2) * uy);
        heroes.push({
          url,
          layer: hero.layer,
          angle: Math.round(hero.angle * 10000) / 10000,
          start: proj(hero.start),
          end: proj(hero.end),
        });
      }
      entry[variant] = { layers, heroes };
    }
    routes[route].sections.push(entry);
  }
}

// 3. Page-wide dust (two depth layers) and the contact tile.
const dust = {};
for (const variant of VARIANTS) {
  const t = TILES[variant];
  const d = composeDust(hashSeed(seed, "dust", variant), { variant });
  dust[variant] = { count: d.count, layers: {} };
  for (const layer of DUST_LAYERS) {
    dust[variant].layers[layer] = save(
      `dust-${variant[0]}-${layer}.avif`,
      await mask(t.width, t.height, d.layers[layer], {
        safe: t.safe,
        cap: SAFE_CAPS[colorOf(layer)],
        feather: false,
      }),
    );
  }
}
const contact = {};
for (const variant of VARIANTS) {
  const t = TILES[variant];
  const c = composeContactTile(hashSeed(seed, "contact", variant), { variant });
  contact[variant] = {};
  for (const layer of LAYERS) {
    const paths = c.elements.filter((e) => e.layer === layer);
    contact[variant][layer] = paths.length
      ? save(
          `contact-${variant[0]}-${layer}.avif`,
          await mask(t.width, t.height, paths, {
            safe: t.safe,
            cap: SAFE_CAPS[layer],
            feather: true,
          }),
        )
      : null;
  }
}

const storm = generateStorm(hashSeed(seed, "storm"));
const stormJson = JSON.stringify(storm);
fs.writeFileSync(path.join(outDir, "storm.json"), stormJson);
sizes.set("storm.json", stormJson.length);
const grain = await writeGrain(seed);

const manifest = {
  seed,
  format: "avif",
  tiles: Object.fromEntries(
    VARIANTS.map((v) => [v, { width: TILES[v].width, height: TILES[v].height }]),
  ),
  routes,
  dust,
  contact,
  storm: "/backdrop/storm.json",
  grain: { file: grain, size: GRAIN_SIZE },
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

// 4. Budgets.
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const sum = (filter) =>
  [...sizes.entries()].filter(([name]) => filter(name)).reduce((a, [, b]) => a + b, 0);
const shared = sizes.get("storm.json") + sizes.get("grain.webp");
const total = sum(() => true);
let failed = false;
process.stdout.write(`\nbase seed ${seed}\n`);
for (const route of Object.keys(ROUTES)) {
  const desktop = sum((n) => n.startsWith(`tiles/${route}-`) && n.includes("-d-"));
  const phone =
    sum((n) => n.startsWith(`tiles/${route}-`) && n.includes("-m-")) +
    sum((n) => n.startsWith("dust-m-")) +
    (route === "home" ? sum((n) => n.startsWith("contact-m-")) : 0) +
    shared;
  process.stdout.write(
    `${route.padEnd(10)} desktop tiles ${kb(desktop).padStart(9)}   phone payload ${kb(phone).padStart(9)} / ${kb(BUDGET.phonePerRoute)}\n`,
  );
  if (phone > BUDGET.phonePerRoute) failed = true;
}
process.stdout.write(
  `dust ${kb(sum((n) => n.startsWith("dust-")))}, contact ${kb(sum((n) => n.startsWith("contact-")))}, storm.json ${kb(sizes.get("storm.json"))}, grain ${kb(sizes.get("grain.webp"))}\n`,
);
process.stdout.write(
  `dust particles: desktop ${dust.desktop.count}, mobile ${dust.mobile.count}\n`,
);
process.stdout.write(`TOTAL ${kb(total)} / ${kb(BUDGET.total)}\n`);
if (total > BUDGET.total) failed = true;

const sheet = argValue("--sheet");
if (sheet) await writeContactSheet(seed, path.resolve(sheet));

if (failed) {
  process.stderr.write("Backdrop budget exceeded.\n");
  process.exit(1);
}
