import manifest from "@/components/atmosphere/backdrop-manifest.json";
import type { LightningStyle } from "../../../scripts/backdrop/core.mjs";
import { BackdropView, BOLT_ID } from "@/components/atmosphere/BackdropView";
import type { LayerArt } from "@/components/atmosphere/BackdropView";
import { BoltFlash } from "@/components/atmosphere/BoltFlash";
import { compositions } from "@/components/atmosphere/composition";
import type { ArtRef, BackdropVariant } from "@/components/atmosphere/composition";

/** Lightning look for the home hero: "A" hairline, "B" bold glow, null for none. */
const HOME_LIGHTNING: LightningStyle | null = "A";

function artFor(ref: ArtRef): LayerArt {
  const entry =
    ref.type === "stroke"
      ? manifest.strokes.find((s) => s.kind === ref.kind)
      : manifest.splashes[ref.index];
  if (!entry) throw new Error(`Backdrop art missing from manifest: ${JSON.stringify(ref)}`);
  return { kind: "mask", url: `/backdrop/${entry.file}`, width: entry.width, height: entry.height };
}

type BackdropProps = {
  variant: BackdropVariant;
};

/**
 * Decorative ink atmosphere behind a page section (place it as the first child
 * of a `relative isolate` wrapper). Server-rendered static art; the only JS is
 * the tiny once-per-session lightning flash on the home variant.
 */
export function Backdrop({ variant }: BackdropProps) {
  const layers = compositions[variant].map((spec) => ({ spec, art: artFor(spec.art) }));
  const style = variant === "home" ? HOME_LIGHTNING : null;
  const bolt = style
    ? {
        width: manifest.lightning.width,
        height: manifest.lightning.height,
        layers: manifest.lightning.styles[style].map((layer) => ({
          ...layer,
          color: layer.color as "bone" | "royal-light",
        })),
      }
    : null;

  return (
    <>
      <BackdropView layers={layers} bolt={bolt} />
      {bolt ? <BoltFlash targetId={BOLT_ID} /> : null}
    </>
  );
}
