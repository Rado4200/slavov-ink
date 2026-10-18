import type { CSSProperties } from "react";

import manifest from "@/components/atmosphere/backdrop-manifest.json";
import { BACKDROP_LAYERS, TILES_PER_ROUTE } from "@/components/atmosphere/config";
import type { BackdropRoute } from "@/components/atmosphere/config";

import "./backdrop.css";

type CSSVars = CSSProperties & Record<`--${string}`, string>;

const maskUrl = (url: string | null) => (url ? `url(${url})` : "none");

/**
 * Decorative ink atmosphere covering the whole document (main + footer).
 * Rendered as the first child of a page; it positions itself against the
 * layout's `relative isolate` wrapper. Zero JS: every tile layer is a CSS mask
 * (desktop tile on landscape screens, mobile tile on portrait) over a palette
 * token color, so it is never an LCP candidate and loads at image priority.
 */
export function Backdrop({ route }: { route: BackdropRoute }) {
  const sections = manifest.routes[route];
  return (
    <div aria-hidden="true" className="bd">
      {Array.from({ length: TILES_PER_ROUTE[route] }, (_, index) => {
        const section = sections[index % sections.length];
        const mirrored = Math.floor(index / sections.length) % 2 === 1;
        return (
          <div
            key={index}
            className="bd-tile"
            data-mirror={mirrored ? "" : undefined}
            style={{ top: `${index * 100}vh` }}
          >
            {BACKDROP_LAYERS.map((layer) => {
              const desktop = section.desktop[layer];
              const mobile = section.mobile[layer];
              if (!desktop && !mobile) return null;
              const style: CSSVars = { "--bd-d": maskUrl(desktop), "--bd-m": maskUrl(mobile) };
              return <div key={layer} className="bd-layer" data-layer={layer} style={style} />;
            })}
          </div>
        );
      })}
    </div>
  );
}
