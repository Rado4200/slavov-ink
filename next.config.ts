import type { NextConfig } from "next";

import { indexingEnabled } from "./src/lib/indexing";

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
  experimental: {
    // Branded 404 for URLs outside every locale (src/app/global-not-found.tsx).
    globalNotFound: true,
  },
  pageExtensions: includeDevRoutes ? ["tsx", "ts", "dev.tsx"] : ["tsx", "ts"],
  // Until launch (SITE_INDEXING=on) every response says noindex, nofollow.
  async headers() {
    if (indexingEnabled) return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
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
