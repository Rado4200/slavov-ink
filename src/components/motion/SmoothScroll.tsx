"use client";

import { useEffect } from "react";
import type Lenis from "lenis";

/**
 * Lenis smooth scrolling, desktop only: requires a fine pointer and no
 * reduced-motion preference (touch devices already scroll smoothly, and
 * skipping it there protects Total Blocking Time). Loaded after idle.
 *
 * - Anchor links and focus-into-view stay native (anchors: false), so skip
 *   links still move focus and the URL hash updates.
 * - Wheel events inside any <dialog> (mobile menu, future lightbox) or
 *   [data-lenis-prevent] are left alone, so the page behind never scrolls.
 */
export function SmoothScroll() {
  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    let cancelled = false;

    const stop = () => {
      lenis?.destroy();
      lenis = undefined;
    };

    const start = async () => {
      const reduced = reducedMotion.matches && document.documentElement.dataset.effects !== "full";
      if (cancelled || lenis || !finePointer.matches || reduced) return;
      const { default: LenisClass } = await import("lenis");
      if (cancelled) return;
      lenis = new LenisClass({
        autoRaf: true,
        anchors: false,
        stopInertiaOnNavigate: true,
        prevent: (node) => node.closest("dialog") !== null,
      });
    };

    const onPreferenceChange = () => {
      if (finePointer.matches && !reducedMotion.matches) void start();
      else stop();
    };

    // Safari has no requestIdleCallback; fall back to a short timeout.
    const hasIdleCallback = typeof window.requestIdleCallback === "function";
    const idle = hasIdleCallback
      ? window.requestIdleCallback(() => void start(), { timeout: 3000 })
      : window.setTimeout(() => void start(), 1500);

    finePointer.addEventListener("change", onPreferenceChange);
    reducedMotion.addEventListener("change", onPreferenceChange);

    return () => {
      cancelled = true;
      if (hasIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      finePointer.removeEventListener("change", onPreferenceChange);
      reducedMotion.removeEventListener("change", onPreferenceChange);
      stop();
    };
  }, []);

  return null;
}
