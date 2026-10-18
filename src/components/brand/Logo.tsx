import Image from "next/image";
import type { StaticImageData } from "next/image";

import fullSource from "../../../public/brand/logo-current.png";
import monogramSource from "../../../public/brand/monogram-temp.png";
import { site } from "@/content/site";

type Crop = { x: number; y: number; width: number; height: number };

/**
 * The single entry point for the brand logo. Swap a variant by replacing its
 * imported file and crop below; nothing else references the logo files.
 * (Favicons are generated from the monogram: pnpm brand:icons.)
 *
 * TEMP assets (see docs/brand.md): the full lockup is a raster centred on a
 * large black canvas, so its crop is the lockup's bounding box in source pixels
 * (measured with sharp, plus ~10px margin). The monogram file is already tight.
 */
const VARIANTS = {
  full: {
    src: fullSource,
    crop: { x: 329, y: 499, width: 950, height: 1438 },
  },
  monogram: {
    src: monogramSource,
    crop: { x: 0, y: 0, width: monogramSource.width, height: monogramSource.height },
  },
} satisfies Record<string, { src: StaticImageData; crop: Crop }>;

const SIZES = {
  xs: 40,
  sm: 48,
  md: 96,
  lg: 200,
  xl: 360,
} as const;

export type LogoSize = keyof typeof SIZES;
export type LogoVariant = keyof typeof VARIANTS;

type LogoProps = {
  variant?: LogoVariant;
  /** Rendered height. */
  size?: LogoSize;
  /** Adds the token purple glow around the logo shape. */
  glow?: boolean;
  /** Set for the LCP logo only (eager load + preload). */
  preload?: boolean;
  /** Empty string when the logo is decorative next to a text label. */
  alt?: string;
  className?: string;
};

export function Logo({
  variant = "full",
  size = "md",
  glow = false,
  preload = false,
  alt = site.name,
  className,
}: LogoProps) {
  const { src, crop } = VARIANTS[variant];
  const height = SIZES[size];
  const width = Math.round((height * crop.width) / crop.height);
  const scale = src.width / crop.width;
  const renderedImageWidth = Math.ceil(width * scale);

  return (
    <span
      className={[
        "relative inline-block shrink-0 overflow-hidden mix-blend-lighten",
        glow ? "drop-shadow-glow" : "",
        className ?? "",
      ].join(" ")}
      style={{ width, height }}
    >
      <Image
        src={src}
        alt={alt}
        preload={preload}
        loading={preload ? "eager" : "lazy"}
        sizes={`${renderedImageWidth}px`}
        className="absolute max-w-none"
        style={{
          width: `${scale * 100}%`,
          height: "auto",
          left: `${(-crop.x / crop.width) * 100}%`,
          top: `${(-crop.y / crop.height) * 100}%`,
        }}
      />
    </span>
  );
}
