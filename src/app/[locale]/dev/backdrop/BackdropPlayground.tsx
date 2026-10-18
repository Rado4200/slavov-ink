"use client";

import { useId, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { generateSet } from "../../../../../scripts/backdrop/core.mjs";
import type { BackdropSet, LightningStyle, Shape } from "../../../../../scripts/backdrop/core.mjs";
import { BackdropView, BOLT_ID } from "@/components/atmosphere/BackdropView";
import type { ResolvedLayer } from "@/components/atmosphere/BackdropView";
import { compositions } from "@/components/atmosphere/composition";
import type { ArtRef, BackdropVariant } from "@/components/atmosphere/composition";

const WIDTHS = [390, 768, 1440] as const;
type LightningChoice = LightningStyle | "C";

function shapeFor(set: BackdropSet, ref: ArtRef): Shape {
  const shape =
    ref.type === "stroke" ? set.strokes.find((s) => s.kind === ref.kind) : set.splashes[ref.index];
  return shape ?? set.strokes[0];
}

function Choice<T extends string | number>({
  legend,
  value,
  options,
  onChange,
  format = String,
}: {
  legend: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  format?: (value: T) => string;
}) {
  const name = useId();
  return (
    <fieldset className="flex flex-wrap items-center gap-3">
      <legend className="mb-2 text-xs font-semibold tracking-[0.2em] text-ash uppercase">
        {legend}
      </legend>
      {options.map((option) => (
        <label
          key={option}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-ink-line px-3 text-sm text-silver has-checked:border-royal has-checked:text-bone"
        >
          <input
            type="radio"
            name={name}
            checked={option === value}
            onChange={() => onChange(option)}
            className="accent-royal"
          />
          {format(option)}
        </label>
      ))}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold tracking-[0.2em] text-ash uppercase">
      {label}
      {children}
    </label>
  );
}

export function BackdropPlayground({ initialSeed }: { initialSeed: number }) {
  const [seed, setSeed] = useState(initialSeed);
  const [density, setDensity] = useState(1);
  const [intensity, setIntensity] = useState(1);
  const [lightning, setLightning] = useState<LightningChoice>("A");
  const [variant, setVariant] = useState<BackdropVariant>("home");
  const [width, setWidth] = useState<(typeof WIDTHS)[number]>(1440);

  const set = useMemo(() => generateSet(seed), [seed]);

  const layers: ResolvedLayer[] = useMemo(() => {
    const specs = compositions[variant];
    const count = Math.max(1, Math.round(specs.length * density));
    return specs.slice(0, count).map((spec) => {
      const { d, width, height } = shapeFor(set, spec.art);
      return { spec, art: { kind: "inline", d, width, height } };
    });
  }, [set, variant, density]);

  const bolt =
    variant === "home" && lightning !== "C"
      ? {
          width: set.lightning.width,
          height: set.lightning.height,
          layers: set.lightning.styles[lightning],
        }
      : null;

  const replayFlash = () => {
    const svg = document.getElementById(BOLT_ID);
    if (!svg) return;
    svg.removeAttribute("data-flash");
    void svg.getBoundingClientRect(); // restart the CSS animation
    svg.setAttribute("data-flash", "");
  };

  return (
    <div className="px-gutter py-10">
      <h1 className="font-heading text-4xl text-bone">Backdrop playground</h1>
      <p className="mt-2 max-w-prose text-sm text-ash">
        Temporary dev route (noindex). Art regenerates from the seed with the same generator as{" "}
        <code>pnpm backdrop:generate --seed N</code>. Positions come from composition.ts.
      </p>

      <div className="mt-8 grid gap-6 border border-ink-line bg-ink-raised p-6 lg:grid-cols-3">
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
        <Field label={`Stroke density ${Math.round(density * 100)}%`}>
          <input
            type="range"
            min={0.25}
            max={1}
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
        <Choice
          legend="Lightning"
          value={lightning}
          options={["A", "B", "C"] as const}
          onChange={setLightning}
          format={(v) => ({ A: "A hairline", B: "B glow", C: "C none" })[v]}
        />
        <Choice
          legend="Variant"
          value={variant}
          options={["home", "inner"] as const}
          onChange={setVariant}
        />
        <Choice
          legend="Preview width"
          value={width}
          options={WIDTHS}
          onChange={setWidth}
          format={(v) => `${v}px`}
        />
        <button
          type="button"
          onClick={replayFlash}
          className="min-h-11 justify-self-start border border-royal px-4 text-sm text-bone"
        >
          Replay flash
        </button>
      </div>

      <div className="mt-8 overflow-x-auto">
        <div
          data-preview
          className="relative isolate mx-auto border border-ink-line bg-ink"
          style={{ width, height: 760 }}
        >
          <BackdropView layers={layers} bolt={bolt} intensity={intensity} />
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <p className="font-display text-6xl text-bone text-shadow-echo">Slavov Ink</p>
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
