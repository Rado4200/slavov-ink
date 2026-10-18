#!/usr/bin/env node
/**
 * Generates the favicon and Apple touch icon from the (temporary) monogram.
 * Re-run after replacing the logo: pnpm brand:icons
 *
 * The lockup is auto-detected (bounding box of non-black pixels), centred on
 * an ink-black square with breathing room, and written to src/app/ where
 * Next.js picks the files up by convention.
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const input = process.argv[2] ?? path.join(root, "public/brand/monogram-temp.png");
const THRESHOLD = 90; // max channel value above which a pixel belongs to the logo
const PADDING = 0.08; // fraction of the square kept empty on each side
const INK = { r: 0, g: 0, b: 0, alpha: 1 };

const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });

let left = info.width;
let top = info.height;
let right = -1;
let bottom = -1;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    if (Math.max(data[i], data[i + 1], data[i + 2]) > THRESHOLD) {
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
}
if (right < 0) {
  process.stderr.write("No logo pixels found.\n");
  process.exit(1);
}

const crop = { left, top, width: right - left + 1, height: bottom - top + 1 };
const lockup = await sharp(input).removeAlpha().extract(crop).png().toBuffer();

async function writeIcon(file, size) {
  const inner = Math.round(size * (1 - PADDING * 2));
  const resized = await sharp(lockup)
    .resize({ width: inner, height: inner, fit: "contain", background: INK })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: INK } })
    .composite([{ input: resized, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, file));
  process.stdout.write(`wrote ${file} (${size}x${size})\n`);
}

await writeIcon("src/app/icon.png", 64);
await writeIcon("src/app/apple-icon.png", 180);
process.stdout.write(`crop: ${JSON.stringify(crop)}\n`);
