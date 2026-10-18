import type { CSSProperties } from "react";

import type { LightningLayer } from "../../../scripts/backdrop/core.mjs";
import type { LayerSpec } from "@/components/atmosphere/composition";

import "./backdrop.css";

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

export type LayerArt =
  | { kind: "mask"; url: string; width: number; height: number }
  | { kind: "inline"; d: string; width: number; height: number };

export type ResolvedLayer = { spec: LayerSpec; art: LayerArt };

export type BoltArt = { width: number; height: number; layers: LightningLayer[] };

export const BOLT_ID = "backdrop-bolt";

type BackdropViewProps = {
  layers: ResolvedLayer[];
  bolt?: BoltArt | null;
  /** Overrides the --backdrop-intensity token (playground only). */
  intensity?: number;
};

/**
 * Pure presentational backdrop, shared by <Backdrop> (static mask files) and
 * the /dev/backdrop playground (inline paths regenerated from a seed).
 * Decorative only: aria-hidden, no pointer events, behind content.
 */
export function BackdropView({ layers, bolt, intensity }: BackdropViewProps) {
  const rootStyle: CSSVars | undefined =
    intensity === undefined ? undefined : { "--backdrop-intensity": intensity };

  return (
    <div aria-hidden="true" className="backdrop" style={rootStyle}>
      {layers.map(({ spec, art }, index) => {
        const style: CSSVars = {
          left: `${spec.x}%`,
          top: `${spec.y}%`,
          width: `clamp(${spec.minWidth}px, ${spec.width}%, ${spec.maxWidth}px)`,
          aspectRatio: `${art.width} / ${art.height}`,
          rotate: `${spec.rotate}deg`,
          scale: spec.flip ? "-1 1" : undefined,
          color: `var(--${spec.color})`,
          "--layer-opacity": spec.opacity,
          "--layer-depth": spec.depth,
        };
        if (art.kind === "mask") {
          style.maskImage = `url(${art.url})`;
          style.WebkitMaskImage = `url(${art.url})`;
        }
        return (
          <span
            key={index}
            className="backdrop-layer"
            data-art={art.kind}
            data-desktop-only={spec.desktopOnly ? "" : undefined}
            style={style}
          >
            {art.kind === "inline" ? (
              <svg viewBox={`0 0 ${art.width} ${art.height}`} fill="currentColor">
                <path d={art.d} />
              </svg>
            ) : null}
          </span>
        );
      })}

      {bolt ? (
        <span className="backdrop-bolt" style={{ aspectRatio: `${bolt.width} / ${bolt.height}` }}>
          <svg
            id={BOLT_ID}
            viewBox={`0 0 ${bolt.width} ${bolt.height}`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {bolt.layers.map((layer, index) => (
              <path
                key={index}
                d={layer.d}
                stroke={`var(--${layer.color})`}
                strokeOpacity={layer.opacity}
                strokeWidth={layer.strokeWidth}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </span>
      ) : null}
    </div>
  );
}
