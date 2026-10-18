"use client";

import type { ReactNode } from "react";
import { LazyMotion } from "motion/react";
import * as m from "motion/react-m";

import { useMotionPreset } from "@/lib/motion/useMotionPreset";

const loadFeatures = () => import("@/lib/motion/features").then((mod) => mod.default);

type RevealProps = {
  children: ReactNode;
  /** Upward travel in px (ignored under reduced motion). */
  distance?: number;
  delay?: number;
  className?: string;
};

/**
 * Reveal-on-scroll: fades in (plus a small rise) once it enters the viewport.
 * Never wrap the LCP element: it stays invisible until JS runs. Without JS the
 * content is shown by the `[data-reveal]` rule in globals.css.
 */
export function Reveal({ children, distance, delay = 0, className }: RevealProps) {
  const { fadeUp } = useMotionPreset();

  return (
    <LazyMotion features={loadFeatures} strict>
      <m.div
        data-reveal
        className={className}
        variants={fadeUp(distance)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ delay }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
