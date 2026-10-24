/**
 * Absolute base URL for metadata (canonical, hreflang, Open Graph, sitemap).
 * Resolution order, no domain hardcoded:
 *   1. NEXT_PUBLIC_SITE_URL           custom domain (set at launch)
 *   2. VERCEL_PROJECT_PRODUCTION_URL  the project's production hostname
 *   3. VERCEL_URL                     this deployment's hostname
 *   4. http://localhost:3000
 * Values may omit the protocol (Vercel's do); https is assumed. An explicit
 * but malformed NEXT_PUBLIC_SITE_URL fails the build loudly.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      return new URL(withProtocol(explicit));
    } catch {
      throw new Error(`NEXT_PUBLIC_SITE_URL is not a valid URL: "${explicit}"`);
    }
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercelHost) return new URL(withProtocol(vercelHost));

  return new URL("http://localhost:3000");
}

function withProtocol(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
