"use client";

import { useEffect, useRef } from "react";

import { STORM } from "@/components/atmosphere/storm.config";

type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } };

const MAX_LAYERS = 5;

/**
 * Fixed, decorative lightning layer behind all content. Renders an empty SVG;
 * after the page has loaded and gone idle, the engine (separate chunk) is
 * imported and drives strikes imperatively. Nothing loads under
 * prefers-reduced-motion or Save-Data.
 */
export function LightningStorm() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ((navigator as NavigatorWithConnection).connection?.saveData) return;

    let cancelled = false;
    let stop: (() => void) | undefined;
    let idle = 0;
    const hasIdleCallback = typeof window.requestIdleCallback === "function";

    const boot = () => {
      void import("@/components/atmosphere/storm-engine").then(({ startStorm }) => {
        if (!cancelled) stop = startStorm(root, STORM);
      });
    };
    const afterLoad = () => {
      idle = hasIdleCallback
        ? window.requestIdleCallback(boot, { timeout: 4000 })
        : window.setTimeout(boot, 2000);
    };

    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", afterLoad);
      if (hasIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      stop?.();
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="storm">
      <svg className="storm-svg">
        <defs>
          <mask id="storm-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect width="100%" height="100%" fill="white" />
            <path className="storm-cut" fill="black" fillOpacity={STORM.shieldOpacity} />
          </mask>
        </defs>
        <g mask="url(#storm-mask)">
          <g className="storm-bolt">
            {Array.from({ length: MAX_LAYERS }, (_, i) => (
              <path
                key={i}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        </g>
      </svg>
      <div className="storm-wash" />
    </div>
  );
}
