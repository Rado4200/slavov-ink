"use client";

import { useReducedMotion } from "motion/react";

import { fadeUp } from "@/lib/motion/variants";

/** Shared presets that automatically respect prefers-reduced-motion. */
export function useMotionPreset() {
  const reduced = useReducedMotion() ?? false;
  return { reduced, fadeUp: (distance?: number) => fadeUp(reduced, distance) };
}
