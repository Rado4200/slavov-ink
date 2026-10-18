"use client";

import { useEffect } from "react";

const SESSION_KEY = "slavov-ink:bolt-flashed";

/**
 * Triggers the lightning's single soft flash once per browser session.
 * Renders nothing; it only adds `data-flash` after mount, so server and client
 * HTML always match. Skipped under prefers-reduced-motion (CSS guards it too).
 */
export function BoltFlash({ targetId }: { targetId: string }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      return; // storage blocked: stay calm rather than flash on every visit
    }
    document.getElementById(targetId)?.setAttribute("data-flash", "");
  }, [targetId]);

  return null;
}
