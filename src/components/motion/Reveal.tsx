import type { CSSProperties, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Upward travel in px while revealing. */
  distance?: number;
  className?: string;
};

/**
 * Section reveal: children fade and lift in (staggered 75 ms) when the section
 * enters the viewport (<Effects> sets data-inview). Visible without JS, never
 * wraps the LCP element, off under reduced motion. Styles: globals.css.
 */
export function Reveal({ children, distance = 16, className }: RevealProps) {
  const style = { "--reveal-distance": `${distance}px` } as CSSProperties;
  return (
    <div data-reveal className={className} style={style}>
      {children}
    </div>
  );
}
