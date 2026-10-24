import { execFileSync } from "node:child_process";
import type { NextConfig } from "next";

import { indexingEnabled } from "./src/lib/indexing";

/**
 * Dev-only routes use the `page.dev.tsx` extension (currently /dev/type).
 * They exist in `next dev`, and in a build only with ENABLE_DEV_ROUTES=1
 * (e.g. on a Vercel preview), so they never ship to production by accident.
 */
const includeDevRoutes =
  process.env.NODE_ENV !== "production" || process.env.ENABLE_DEV_ROUTES === "1";

/** Local fallback for build info when Vercel's system variables are absent. */
function git(args: string[]): string {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Build identity, captured once per build (each deploy is a new build) and
 * inlined as constants: served by /version.json and the footer build stamp.
 */
const build = {
  BUILD_COMMIT: process.env.VERCEL_GIT_COMMIT_SHA || git(["rev-parse", "HEAD"]) || "unknown",
  BUILD_BRANCH:
    process.env.VERCEL_GIT_COMMIT_REF || git(["rev-parse", "--abbrev-ref", "HEAD"]) || "unknown",
  BUILD_ENV: process.env.VERCEL_ENV || "local",
  BUILD_TIME: new Date().toISOString(),
};

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  env: build,
  experimental: {
    // Branded 404 for URLs outside every locale (src/app/global-not-found.tsx).
    globalNotFound: true,
  },
  pageExtensions: includeDevRoutes ? ["tsx", "ts", "dev.tsx"] : ["tsx", "ts"],
  async headers() {
    const version = {
      source: "/version.json",
      headers: [
        { key: "Cache-Control", value: "no-store" },
        { key: "X-Robots-Tag", value: "noindex" },
      ],
    };
    if (indexingEnabled) return [version];
    // Until launch (SITE_INDEXING=on) every response says noindex, nofollow.
    return [
      { source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      version,
    ];
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
