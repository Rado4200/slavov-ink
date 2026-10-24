import type { CSSProperties } from "react";

import manifest from "@/components/atmosphere/backdrop-manifest.json";
import { BACKDROP_LAYERS, DRAW, DRAW_SCALE, TILES_PER_ROUTE } from "@/components/atmosphere/config";
import type { BackdropRoute } from "@/components/atmosphere/config";

import "./backdrop.css";

type CSSVars = CSSProperties & Record<`--${string}`, string>;
type Variant = "desktop" | "mobile";
type Hero = { url: string; layer: string; angle: number; start: number; end: number };

const maskUrl = (url: string | null) => (url ? `url(${url})` : "none");

/**
 * Draw-on geometry (compositor-only): a rotated, scaled clip window (.bd-draw)
 * slides along the stroke direction while the stroke inside (.bd-hero) is
 * counter-translated, so the stroke stays put and its reveal edge travels from
 * start to end. Tile px become CSS lengths via --s (cover scale, cq units).
 */
function heroStyle(hero: Hero, variant: Variant, index: number): CSSVars {
  const { width, height } = manifest.tiles[variant];
  const cos = Math.cos(hero.angle).toFixed(5);
  const sin = Math.sin(hero.angle).toFixed(5);
  const s = `max(calc(100cqw / ${width}), calc(100cqh / ${height}))`;
  const e0 = `calc(${DRAW_SCALE} * 50cqw)`;
  const d0 = `calc(${e0} - ${s} * ${hero.start})`;
  const d1 = `calc(${e0} - ${s} * ${hero.end} - 4cqw)`;
  const length = Math.abs(hero.end - hero.start) / Math.hypot(width, height);
  const duration = Math.round(DRAW.minMs + (DRAW.maxMs - DRAW.minMs) * Math.min(1, length));
  return {
    "--a": `${hero.angle}rad`,
    "--w-from": `calc(${d0} * ${-cos}) calc(${d0} * ${-sin})`,
    "--w-to": `calc(${d1} * ${-cos}) calc(${d1} * ${-sin})`,
    "--i-from": `calc(${d0} / ${DRAW_SCALE})`,
    "--i-to": `calc(${d1} / ${DRAW_SCALE})`,
    "--draw-ms": `${duration}ms`,
    "--draw-delay": `${index * DRAW.staggerMs}ms`,
    "--bd-mask": `url(${hero.url})`,
  };
}

/**
 * Decorative ink atmosphere covering the whole document (main + footer).
 * Rendered as the first child of a page; it positions itself against the
 * layout's `relative isolate` wrapper. Every layer is a CSS mask over a
 * palette token (never an LCP candidate); desktop tiles on landscape screens,
 * mobile tiles on portrait. Layers fade in once decoded (see Effects).
 */
export function Backdrop({ route }: { route: BackdropRoute }) {
  const { sections } = manifest.routes[route];
  return (
    <div aria-hidden="true" className="bd">
      {Array.from({ length: TILES_PER_ROUTE[route] }, (_, index) => {
        const section = sections[index % sections.length];
        const mirrored = Math.floor(index / sections.length) % 2 === 1;
        const heroes = index === 0 ? (["desktop", "mobile"] as const) : [];
        return (
          <div
            key={index}
            className="bd-tile fx-decode"
            data-mirror={mirrored ? "" : undefined}
            style={{ top: `${index * 100}lvh` }}
          >
            {BACKDROP_LAYERS.map((layer) => {
              const desktop = section.desktop.layers[layer];
              const mobile = section.mobile.layers[layer];
              if (!desktop && !mobile) return null;
              const style: CSSVars = { "--bd-d": maskUrl(desktop), "--bd-m": maskUrl(mobile) };
              return (
                <div
                  key={layer}
                  className="bd-layer"
                  data-layer={layer}
                  data-d={desktop ? "" : undefined}
                  data-m={mobile ? "" : undefined}
                  style={style}
                />
              );
            })}
            {heroes.flatMap((variant) =>
              section[variant].heroes.map((hero, i) => (
                <div
                  key={`${variant}-${i}`}
                  className="bd-draw"
                  data-variant={variant}
                  style={heroStyle(hero, variant, i)}
                >
                  <div className="bd-hero" data-layer={hero.layer} />
                </div>
              )),
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Behind the glass contact panel: bold strokes + echo + dust band. */
export function ContactBackdrop() {
  const { desktop, mobile } = manifest.contact;
  return (
    <div aria-hidden="true" className="bd-contact fx-decode">
      {BACKDROP_LAYERS.map((layer) => {
        const d = desktop[layer];
        const m = mobile[layer];
        if (!d && !m) return null;
        const style: CSSVars = { "--bd-d": maskUrl(d), "--bd-m": maskUrl(m) };
        return (
          <div
            key={layer}
            className="bd-layer"
            data-layer={layer}
            data-d={d ? "" : undefined}
            data-m={m ? "" : undefined}
            style={style}
          />
        );
      })}
    </div>
  );
}

/** Page-wide dust on a fixed layer: two depth layers drifting very slowly (CSS). */
export function Dust() {
  const layers = (depth: "far" | "near") =>
    (["bone", depth === "far" ? "royal" : "royal-light"] as const).map((color) => {
      const key = `${depth}-${color}` as keyof typeof manifest.dust.desktop.layers;
      const style: CSSVars = {
        "--bd-d": maskUrl(manifest.dust.desktop.layers[key]),
        "--bd-m": maskUrl(manifest.dust.mobile.layers[key]),
      };
      return <div key={key} className="bd-dust-layer" data-layer={color} style={style} />;
    });
  return (
    <div aria-hidden="true" className="bd-dust fx-decode">
      <div className="bd-dust-far">{layers("far")}</div>
      <div className="bd-dust-near">{layers("near")}</div>
    </div>
  );
}
