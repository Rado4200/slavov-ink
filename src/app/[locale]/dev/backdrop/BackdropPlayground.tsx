"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { FAMILIES, composeTile, hashSeed } from "../../../../../scripts/backdrop/core.mjs";
import type { FamilyOrSpatter, Variant } from "../../../../../scripts/backdrop/core.mjs";

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

const ALL_FAMILIES: FamilyOrSpatter[] = [...FAMILIES, "spatter"];
const LAYER_ORDER = ["royal", "royal-light", "bone"] as const;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold tracking-[0.2em] text-ash uppercase">
      {label}
      {children}
    </label>
  );
}

const chip =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 border border-ink-line px-3 text-sm text-silver has-checked:border-royal has-checked:text-bone";

export function BackdropPlayground({ initialSeed }: { initialSeed: number }) {
  const [seed, setSeed] = useState(initialSeed);
  const [density, setDensity] = useState(1);
  const [intensity, setIntensity] = useState(1);
  const [nibAngle, setNibAngle] = useState(40);
  const [families, setFamilies] = useState<Set<FamilyOrSpatter>>(() => new Set(ALL_FAMILIES));
  const [presetIndex, setPresetIndex] = useState(2);
  const [safeZone, setSafeZone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const presetName = useId();
  const preset = PRESETS[presetIndex];

  // Same sub-seed the generator uses for the home page, section 0.
  const tile = useMemo(
    () =>
      composeTile(hashSeed(seed, "home", 0, preset.variant), {
        variant: preset.variant,
        density,
        nibAngle,
        families,
      }),
    [seed, preset.variant, density, nibAngle, families],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = tile.width;
    canvas.height = tile.height;
    ctx.clearRect(0, 0, tile.width, tile.height);
    const css = getComputedStyle(document.documentElement);
    for (const layer of LAYER_ORDER) {
      ctx.fillStyle = css.getPropertyValue(`--${layer}`).trim();
      for (const el of tile.elements) {
        if (el.layer !== layer) continue;
        ctx.globalAlpha = el.alpha * intensity;
        ctx.fill(new Path2D(el.d));
      }
    }
    ctx.globalAlpha = 1;
  }, [tile, intensity]);

  const toggle = (family: FamilyOrSpatter) =>
    setFamilies((current) => {
      const next = new Set(current);
      if (next.has(family)) next.delete(family);
      else next.add(family);
      return next;
    });

  return (
    <div className="px-gutter py-10">
      <h1 className="font-heading text-4xl text-bone">Backdrop playground</h1>
      <p className="mt-2 max-w-prose text-sm text-ash">
        Temporary dev route (noindex). Live preview of one tile (home, section 0) from the same
        seeded generator as <code>pnpm backdrop:generate --seed N</code>. Trigger strike fires the
        real storm layer behind this page.
      </p>

      <div className="mt-8 grid gap-6 border border-ink-line bg-ink-raised p-6 md:grid-cols-2 xl:grid-cols-4">
        <Field label={`Seed ${seed}`}>
          <span className="flex gap-2">
            <input
              type="number"
              min={0}
              value={seed}
              onChange={(event) => setSeed(Math.max(0, Number(event.target.value) || 0))}
              className="min-h-11 w-32 border border-ink-line bg-ink px-3 text-base text-bone"
            />
            <button
              type="button"
              onClick={() => setSeed((value) => value + 1)}
              className="min-h-11 border border-ink-line px-4 text-sm text-bone"
            >
              Next seed
            </button>
          </span>
        </Field>
        <Field label={`Density ×${density.toFixed(2)}`}>
          <input
            type="range"
            min={0.25}
            max={2}
            step={0.25}
            value={density}
            onChange={(event) => setDensity(Number(event.target.value))}
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
            onChange={(event) => setIntensity(Number(event.target.value))}
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
            onChange={(event) => setNibAngle(Number(event.target.value))}
            className="accent-royal"
          />
        </Field>

        <fieldset className="flex flex-wrap gap-3 md:col-span-2">
          <legend className="mb-2 text-xs font-semibold tracking-[0.2em] text-ash uppercase">
            Families
          </legend>
          {ALL_FAMILIES.map((family) => (
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
          <legend className="mb-2 text-xs font-semibold tracking-[0.2em] text-ash uppercase">
            Viewport
          </legend>
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
              checked={safeZone}
              onChange={() => setSafeZone((value) => !value)}
              className="accent-royal"
            />
            Safe zone
          </label>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("storm:strike"))}
            className="min-h-11 border border-royal px-4 text-sm text-bone"
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
            ref={canvasRef}
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
          <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
            <p className="font-heading text-5xl text-bone">Slavov Ink</p>
            <p className="mt-6 max-w-prose text-base text-silver">
              Sample body text in silver, to judge readability over the art. Every piece starts with
              a conversation.
            </p>
            <p className="mt-3 text-sm text-ash">Secondary text in ash.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
