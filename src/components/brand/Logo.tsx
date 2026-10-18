import Image from "next/image";

import logoSource from "../../../public/brand/logo-current.png";
import { ui } from "@/content/ui";

/**
 * The single entry point for the brand logo. Swap the logo by replacing the
 * imported file and updating LOGO_CROP below; nothing else references it.
 * (Favicons are generated from the same file: pnpm brand:icons.)
 *
 * The current asset is a raster lockup centred on a large black canvas.
 * LOGO_CROP is the lockup's bounding box in source pixels (measured with sharp,
 * plus ~10px safety margin), so the canvas padding is never rendered.
 */
const LOGO_CROP = { x: 329, y: 499, width: 950, height: 1438 } as const;

const SIZES = {
  sm: 48,
  md: 96,
  lg: 200,
  xl: 360,
} as const;

export type LogoSize = keyof typeof SIZES;
export type LogoVariant = "plain" | "glow";

type LogoProps = {
  /** Rendered height of the lockup. */
  size?: LogoSize;
  variant?: LogoVariant;
  /** Set for the LCP logo only (eager load + preload). */
  preload?: boolean;
  /** Empty string when the logo is decorative next to a text label. */
  alt?: string;
  className?: string;
};

export function Logo({
  size = "md",
  variant = "plain",
  preload = false,
  alt = ui.logoAlt,
  className,
}: LogoProps) {
  const height = SIZES[size];
  const width = Math.round((height * LOGO_CROP.width) / LOGO_CROP.height);
  const scale = logoSource.width / LOGO_CROP.width;
  const renderedImageWidth = Math.ceil(width * scale);

  return (
    <span
      className={[
        "relative inline-block shrink-0 overflow-hidden mix-blend-lighten",
        variant === "glow" ? "drop-shadow-glow" : "",
        className ?? "",
      ].join(" ")}
      style={{ width, height }}
    >
      <Image
        src={logoSource}
        alt={alt}
        preload={preload}
        loading={preload ? "eager" : "lazy"}
        sizes={`${renderedImageWidth}px`}
        className="absolute max-w-none"
        style={{
          width: `${scale * 100}%`,
          height: "auto",
          left: `${(-LOGO_CROP.x / LOGO_CROP.width) * 100}%`,
          top: `${(-LOGO_CROP.y / LOGO_CROP.height) * 100}%`,
        }}
      />
    </span>
  );
}
