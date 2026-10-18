import type { NextConfig } from "next";

/**
 * Dev-only routes use the `page.dev.tsx` extension (currently /dev/type).
 * They exist in `next dev`, and in a build only with ENABLE_DEV_ROUTES=1
 * (e.g. on a Vercel preview), so they never ship to production by accident.
 */
const includeDevRoutes =
  process.env.NODE_ENV !== "production" || process.env.ENABLE_DEV_ROUTES === "1";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  pageExtensions: includeDevRoutes ? ["tsx", "ts", "dev.tsx"] : ["tsx", "ts"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
