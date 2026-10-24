"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  DUST_LAYERS,
  FAMILIES,
  SAFE_CAPS,
  clampSafeZone,
  composeContactTile,
  composeDust,
  composeTile,
  hashSeed,
  scoreTile,
} from "../../../../../scripts/backdrop/core.mjs";
import type { Family, Layer, Variant } from "../../../../../scripts/backdrop/core.mjs";

import "@/components/contact/contact.css";

export type SeedOption = { route: string; seed: number; pinned: boolean; score: string };

const PRESETS = [
  { label: "390", width: 390, height: 844, variant: "mobile" },
  { label: "768", width: 768, height: 1024, variant: "mobile" },
  { label: "1440", width: 1440, height: 900, variant: "desktop" },
] as const satisfies ReadonlyArray<{
  label: string;
  width: number;
  height: number;
  variant: Variant;
}>;

type Paths = Array<{ layer: Layer; alpha: number; d: string }>;

const chip =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 border border-ink-line px-3 text-sm text-silver has-checked:border-royal has-checked:text-bone";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 label-ui text-ash">
      {label}
      {children}
    </label>
  );
}

/** Same pipeline as the generator: per-layer raster, content-column clamp, token tint. */
function render(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  paths: Paths,
  safe: [number, number] | null,
  intensity: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  const css = getComputedStyle(document.documentElement);
  const layer = document.createElement("canvas");
  layer.width = width;
  layer.height = height;
  const lctx = layer.getContext("2d");
  if (!lctx) return;
  for (const name of ["royal", "royal-light", "bone"] as const) {
    const own = paths.filter((p) => p.layer === name);
    if (!own.length) continue;
    lctx.clearRect(0, 0, width, height);
    lctx.fillStyle = css.getPropertyValue(`--${name}`).trim();
    for (const p of own) {
      lctx.globalAlpha = p.alpha;
      lctx.fill(new Path2D(p.d));
    }
    if (safe) {
      const image = lctx.getImageData(0, 0, width, height);
      const alpha = new Uint8Array(width * height);
      for (let i = 0; i < alpha.length; i++) alpha[i] = image.data[i * 4 + 3];
      clampSafeZone(alpha, width, height, safe, SAFE_CAPS[name]);
      for (let i = 0; i < alpha.length; i++) image.data[i * 4 + 3] = alpha[i];
      lctx.putImageData(image, 0, 0);
    }
    ctx.globalAlpha = intensity;
    ctx.drawImage(layer, 0, 0);
  }
  ctx.globalAlpha = 1;
}

export function BackdropPlayground({ baseSeed, seeds }: { baseSeed: number; seeds: SeedOption[] }) {
  const [seed, setSeed] = useState(seeds.find((s) => s.pinned)?.seed ?? baseSeed);
  const [density, setDensity] = useState(1);
  const [particleDensity, setParticleDensity] = useState(1);
  const [particleSize, setParticleSize] = useState(1);
  const [intensity, setIntensity] = useState(1);
  const [nibAngle, setNibAngle] = useState(40);
  const [families, setFamilies] = useState<Set<Family>>(() => new Set(FAMILIES));
  const [presetIndex, setPresetIndex] = useState(2);
  const [contact, setContact] = useState(false);
  const [safeZone, setSafeZone] = useState(false);
  const strokeRef = useRef<HTMLCanvasElement>(null);
  const dustRef = useRef<HTMLCanvasElement>(null);
  const presetName = useId();
  const seedName = useId();
  const preset = PRESETS[presetIndex];

  const tile = useMemo(
    () =>
      composeTile(hashSeed(seed, 0, preset.variant), {
        variant: preset.variant,
        density,
        nibAngle,
        families,
        hero: true,
      }),
    [seed, preset.variant, density, nibAngle, families],
  );
  const contactTile = useMemo(
    () =>
      composeContactTile(hashSeed(baseSeed, "contact", preset.variant), {
        variant: preset.variant,
        nibAngle,
      }),
    [baseSeed, preset.variant, nibAngle],
  );
  const dust = useMemo(
    () =>
      composeDust(hashSeed(baseSeed, "dust", preset.variant), {
        variant: preset.variant,
        density: particleDensity,
        size: particleSize,
      }),
    [baseSeed, preset.variant, particleDensity, particleSize],
  );
  const score = scoreTile(tile);

  useEffect(() => {
    if (!strokeRef.current) return;
    const paths: Paths = contact ? contactTile.elements : [...tile.elements, ...tile.heroes];
    render(
      strokeRef.current,
      tile.width,
      tile.height,
      paths,
      contact ? null : tile.safe,
      intensity,
    );
  }, [tile, contactTile, contact, intensity]);

  useEffect(() => {
    if (!dustRef.current) return;
    const paths: Paths = DUST_LAYERS.flatMap((name) =>
      dust.layers[name].map(
        (p) =>
          ({
            ...p,
            layer: name.endsWith("royal-light")
              ? "royal-light"
              : name.endsWith("royal")
                ? "royal"
                : "bone",
          }) as const,
      ),
    );
    render(dustRef.current, dust.width, dust.height, paths, dust.safe, intensity);
  }, [dust, intensity]);

  const toggle = (family: Family) =>
    setFamilies((current) => {
      const next = new Set(current);
      if (next.has(family)) next.delete(family);
      else next.add(family);
      return next;
    });

  return (
    <div className="px-gutter py-10">
      <h1 className="text-bone">Backdrop</h1>
      <p className="mt-2 max-w-prose text-sm text-ash">
        Temporary dev route (noindex). Live preview of section 0 for the chosen seed, from the same
        generator as <code>pnpm backdrop:generate</code>. Trigger strike fires the real storm layer.
      </p>

      <div className="mt-8 grid gap-6 border border-ink-line bg-ink-raised p-6 md:grid-cols-2 xl:grid-cols-4">
        <fieldset className="flex flex-col gap-2 md:col-span-2 xl:col-span-4">
          <legend className="mb-2 label-ui text-ash">Seeds (5 candidates per route, scored)</legend>
          <div className="grid gap-2 md:grid-cols-3">
            {seeds.map((s) => (
              <label key={`${s.route}-${s.seed}`} className={chip}>
                <input
                  type="radio"
                  name={seedName}
                  checked={seed === s.seed}
                  onChange={() => setSeed(s.seed)}
                  className="accent-royal"
                />
                {s.route} {s.pinned ? "· pinned" : ""} · {s.score}
              </label>
            ))}
          </div>
          <span className="flex items-center gap-2 text-sm text-silver">
            Custom seed
            <input
              type="number"
              min={0}
              value={seed}
              onChange={(event) => setSeed(Math.max(0, Number(event.target.value) || 0))}
              className="min-h-11 w-40 border border-ink-line bg-ink px-3 text-base text-bone"
            />
            score {score.total} (clearance {score.clearance}, balance {score.balance}, density{" "}
            {score.density})
          </span>
        </fieldset>

        <Field label={`Stroke density ×${density.toFixed(2)}`}>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.25}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="accent-royal"
          />
        </Field>
        <Field label={`Particle density ×${particleDensity.toFixed(2)}`}>
          <input
            type="range"
            min={0.25}
            max={1.5}
            step={0.25}
            value={particleDensity}
            onChange={(e) => setParticleDensity(Number(e.target.value))}
            className="accent-royal"
          />
        </Field>
        <Field label={`Particle size ×${particleSize.toFixed(2)}`}>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.25}
            value={particleSize}
            onChange={(e) => setParticleSize(Number(e.target.value))}
            className="accent-royal"
          />
        </Field>
        <Field label={`Intensity ${intensity.toFixed(2)}`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="accent-royal"
          />
        </Field>
        <Field label={`Nib angle ${nibAngle}°`}>
          <input
            type="range"
            min={20}
            max={60}
            step={1}
            value={nibAngle}
            onChange={(e) => setNibAngle(Number(e.target.value))}
            className="accent-royal"
          />
        </Field>

        <fieldset className="flex flex-wrap gap-3 md:col-span-2">
          <legend className="mb-2 label-ui text-ash">Families</legend>
          {FAMILIES.map((family) => (
            <label key={family} className={chip}>
              <input
                type="checkbox"
                checked={families.has(family)}
                onChange={() => toggle(family)}
                className="accent-royal"
              />
              {family}
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-wrap gap-3">
          <legend className="mb-2 label-ui text-ash">Viewport</legend>
          {PRESETS.map((p, index) => (
            <label key={p.label} className={chip}>
              <input
                type="radio"
                name={presetName}
                checked={index === presetIndex}
                onChange={() => setPresetIndex(index)}
                className="accent-royal"
              />
              {p.label}
            </label>
          ))}
        </fieldset>

        <div className="flex flex-wrap items-end gap-3">
          <label className={chip}>
            <input
              type="checkbox"
              checked={contact}
              onChange={() => setContact((v) => !v)}
              className="accent-royal"
            />
            Contact section
          </label>
          <label className={chip}>
            <input
              type="checkbox"
              checked={safeZone}
              onChange={() => setSafeZone((v) => !v)}
              className="accent-royal"
            />
            Safe zone
          </label>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("storm:strike"))}
            className="min-h-11 border border-royal px-4 label-ui text-bone"
          >
            Trigger strike
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <div
          data-preview
          className="relative mx-auto border border-ink-line"
          style={{ width: preset.width, height: preset.height }}
        >
          <canvas
            ref={dustRef}
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover"
          />
          <canvas
            ref={strokeRef}
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover"
          />
          {safeZone ? (
            <div
              aria-hidden="true"
              className="absolute inset-y-0 border-x border-dashed border-royal-light"
              style={{ left: `${tile.safe[0] * 100}%`, right: `${(1 - tile.safe[1]) * 100}%` }}
            />
          ) : null}
          {contact ? (
            <div className="relative flex h-full flex-col items-center justify-center px-6">
              <h2 className="text-bone">Get in touch</h2>
              <div className="glass mt-8 h-1/2 w-full max-w-2xl p-8">
                <p className="label-ui text-silver">Glass panel preview</p>
              </div>
            </div>
          ) : (
            <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
              <h1 className="text-bone">Portfolio</h1>
              <p className="mt-6 max-w-prose text-base text-silver">
                Sample body text in silver, to judge readability over the art.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
