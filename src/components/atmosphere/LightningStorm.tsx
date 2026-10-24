"use client";

import { useEffect, useRef } from "react";

import { STORM } from "@/components/atmosphere/storm.config";

type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } };

const LAYERS = 5;
const MASK_ID = "storm-shield";

function BoltLayer({ masked }: { masked?: boolean }) {
  return (
    <svg className="storm-svg">
      {masked ? (
        <defs>
          <mask id={MASK_ID} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect width="100%" height="100%" fill="white" />
            <path className="storm-cut" fill="black" fillOpacity={1 - STORM.shieldFloor} />
          </mask>
        </defs>
      ) : null}
      <g mask={`url(#${MASK_ID})`}>
        <g>
          {Array.from({ length: LAYERS }, (_, i) => (
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
  );
}

/**
 * Fixed, decorative lightning layer behind all content (two composited SVGs:
 * the bright strike and its purple afterglow). After load + idle (so never
 * before LCP) the engine chunk loads and drives strikes. Reduced motion gets a
 * gentle, non-flashing version unless ?effects=full; Save-Data gets none.
 */
export function LightningStorm() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || (navigator as NavigatorWithConnection).connection?.saveData) return;
    const gentle =
      matchMedia("(prefers-reduced-motion: reduce)").matches &&
      document.documentElement.dataset.effects !== "full";
    let cancelled = false;
    let stop: (() => void) | undefined;
    let idle = 0;
    const hasIdle = typeof window.requestIdleCallback === "function";
    const boot = () => {
      const idleAt = performance.now();
      void import("@/components/atmosphere/storm-engine").then(({ startStorm }) => {
        if (!cancelled) stop = startStorm(root, STORM, gentle, idleAt);
      });
    };
    const afterLoad = () => {
      idle = hasIdle
        ? window.requestIdleCallback(boot, { timeout: 3000 })
        : window.setTimeout(boot, 1000);
    };
    if (document.readyState === "complete") afterLoad();
    else addEventListener("load", afterLoad, { once: true });
    return () => {
      cancelled = true;
      removeEventListener("load", afterLoad);
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      stop?.();
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="storm">
      <div className="storm-wash" />
      <BoltLayer />
      <BoltLayer masked />
    </div>
  );
}
