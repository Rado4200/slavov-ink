import type { CSSProperties, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Upward travel in px while revealing. */
  distance?: number;
  className?: string;
};

/**
 * Reveal-on-scroll with zero JavaScript. Content is visible by default (no-JS
 * safe, never delays LCP); browsers that support scroll-driven animations
 * (`animation-timeline: view()`) fade and lift it in as it enters the
 * viewport. Disabled under prefers-reduced-motion. Styles: globals.css.
 */
export function Reveal({ children, distance = 16, className }: RevealProps) {
  const style = { "--reveal-distance": `${distance}px` } as CSSProperties;
  return (
    <div data-reveal className={className} style={style}>
      {children}
    </div>
  );
}
