/**
 * Search indexing switch. Everything is noindex (robots.txt disallow all,
 * X-Robots-Tag header, <meta name="robots">) unless SITE_INDEXING=on.
 * Read at build time: changing it on Vercel needs a redeploy.
 * Imported by next.config.ts, so keep it dependency-free.
 */
export const indexingEnabled = process.env.SITE_INDEXING === "on";
