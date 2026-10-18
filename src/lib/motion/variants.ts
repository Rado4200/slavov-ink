import type { Variants } from "motion/react";

import { duration, easing } from "@/lib/motion/tokens";

/** Small upward reveal. Under reduced motion: opacity only, no movement. */
export function fadeUp(reduced: boolean, distance = 16): Variants {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? duration.base : duration.slow,
        ease: easing.outExpo,
      },
    },
  };
}
