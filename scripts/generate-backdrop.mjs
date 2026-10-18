#!/usr/bin/env node
/**
 * Generates the "ink atmosphere" assets from a seed.
 *
 * Usage: pnpm backdrop:generate [--seed N]   (default: the seed in the manifest)
 *
 * Outputs
 *   public/backdrop/stroke-<kind>.svg   brush strokes (alpha masks; colour comes from CSS tokens)
 *   public/backdrop/splash-<n>.svg      ink splashes
 *   public/backdrop/grain.webp          static film-grain tile (replaces a runtime SVG filter)
 *   src/components/atmosphere/backdrop-manifest.json
 *                                       sizes, file names and the inline lightning paths
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { createRng, generateSet } from "./backdrop/core.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "public/backdrop");
const manifestPath = path.join(root, "src/components/atmosphere/backdrop-manifest.json");
const BUDGET_BYTES = 150 * 1024;
const GRAIN_SIZE = 128;

function readSeed() {
  const flag = process.argv.indexOf("--seed");
  if (flag !== -1) {
    const value = Number.parseInt(process.argv[flag + 1] ?? "", 10);
    if (!Number.isInteger(value) || value < 0) {
      process.stderr.write("--seed must be a non-negative integer\n");
      process.exit(1);
    }
    return value;
  }
  if (fs.existsSync(manifestPath)) return JSON.parse(fs.readFileSync(manifestPath, "utf8")).seed;
  return 7;
}

const svg = (shape) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${shape.width} ${shape.height}"><path d="${shape.d}"/></svg>\n`;

async function writeGrain(seed) {
  const rng = createRng(seed ^ 0x9e3779b9);
  const pixels = Buffer.alloc(GRAIN_SIZE * GRAIN_SIZE * 4);
  for (let i = 0; i < GRAIN_SIZE * GRAIN_SIZE; i++) {
    pixels[i * 4] = 255;
    pixels[i * 4 + 1] = 255;
    pixels[i * 4 + 2] = 255;
    pixels[i * 4 + 3] = Math.floor(rng() * 256);
  }
  await sharp(pixels, { raw: { width: GRAIN_SIZE, height: GRAIN_SIZE, channels: 4 } })
    .webp({ quality: 60, alphaQuality: 45, effort: 6 })
    .toFile(path.join(outDir, "grain.webp"));
}

const seed = readSeed();
const set = generateSet(seed);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const strokes = set.strokes.map((shape) => {
  const file = `stroke-${shape.kind}.svg`;
  fs.writeFileSync(path.join(outDir, file), svg(shape));
  return { kind: shape.kind, file, width: shape.width, height: shape.height };
});

const splashes = set.splashes.map((shape, index) => {
  const file = `splash-${index + 1}.svg`;
  fs.writeFileSync(path.join(outDir, file), svg(shape));
  return { file, width: shape.width, height: shape.height };
});

await writeGrain(seed);

const manifest = {
  seed,
  strokes,
  splashes,
  lightning: set.lightning,
  grain: { file: "grain.webp", size: GRAIN_SIZE },
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

// Budget: every public asset plus the inline lightning paths shipped in HTML.
const files = fs
  .readdirSync(outDir)
  .map((file) => ({ file, bytes: fs.statSync(path.join(outDir, file)).size }));
const inlineBytes = Object.values(set.lightning.styles)
  .flat()
  .reduce((sum, layer) => sum + layer.d.length, 0);
const total = files.reduce((sum, f) => sum + f.bytes, 0) + inlineBytes;

for (const f of files)
  process.stdout.write(`${f.file.padEnd(22)} ${(f.bytes / 1024).toFixed(1)} KB\n`);
process.stdout.write(`${"lightning (inline)".padEnd(22)} ${(inlineBytes / 1024).toFixed(1)} KB\n`);
process.stdout.write(
  `seed ${seed}: total ${(total / 1024).toFixed(1)} KB of ${BUDGET_BYTES / 1024} KB budget\n`,
);

if (total > BUDGET_BYTES) {
  process.stderr.write("Backdrop assets exceed the 150 KB budget.\n");
  process.exit(1);
}
