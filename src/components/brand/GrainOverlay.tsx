import manifest from "@/components/atmosphere/backdrop-manifest.json";

/**
 * Full-viewport film grain, echoing the logo's distressed texture.
 * A pre-rendered seeded noise tile (pnpm backdrop:generate): no runtime SVG
 * filter, no animation, no JS, one cached image.
 */
type GrainOverlayProps = {
  /** 0 to 1. Keep subtle; the default is tuned for ink backgrounds. */
  opacity?: number;
};

export function GrainOverlay({ opacity = 0.05 }: GrainOverlayProps) {
  const size = manifest.grain.size;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-(--z-grain)"
      style={{
        backgroundImage: `url(${manifest.grain.file})`,
        backgroundSize: `${size}px ${size}px`,
        opacity,
      }}
    />
  );
}
