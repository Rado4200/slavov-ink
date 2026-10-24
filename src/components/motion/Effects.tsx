"use client";

import { useEffect } from "react";

const MASK_URL = /url\("?([^")]+)"?\)/;

/** Decodes every mask under `el`, then marks it ready (layers fade in, no pop-in). */
function decodeThenReveal(el: Element) {
  const urls = new Set<string>();
  for (const layer of el.querySelectorAll<HTMLElement>(".bd-layer, .bd-dust-layer, .bd-hero")) {
    const style = getComputedStyle(layer);
    const match = MASK_URL.exec(style.maskImage || style.getPropertyValue("-webkit-mask-image"));
    if (match) urls.add(match[1]);
  }
  void Promise.all(
    [...urls].map((url) => {
      const img = new Image();
      img.src = url;
      return img.decode().catch(() => undefined);
    }),
  ).then(() => el.setAttribute("data-ready", ""));
}

/**
 * One observer for two jobs: backdrop layers fade in once decoded
 * (`.fx-decode` -> data-ready) and sections reveal as they enter the viewport
 * (`[data-reveal]` -> data-inview). Content is visible without JS; the CSS only
 * hides it when scripting is enabled, and never wraps the LCP element.
 */
export function Effects() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (entry.target.classList.contains("fx-decode")) decodeThenReveal(entry.target);
          else entry.target.setAttribute("data-inview", "");
        }
      },
      { rootMargin: "20% 0px" },
    );
    document.querySelectorAll(".fx-decode, [data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
