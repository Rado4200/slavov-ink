/**
 * Full-viewport film grain, echoing the logo's distressed texture.
 * Static SVG turbulence (no animation, no JS), so it costs one paint.
 */
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

type GrainOverlayProps = {
  /** 0 to 1. Keep subtle; the default is tuned for ink backgrounds. */
  opacity?: number;
};

export function GrainOverlay({ opacity = 0.05 }: GrainOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-(--z-grain)"
      style={{ backgroundImage: NOISE_SVG, backgroundSize: "240px 240px", opacity }}
    />
  );
}
