/**
 * Absolute base URL for metadata (canonical, Open Graph).
 * No domain is hardcoded: NEXT_PUBLIC_SITE_URL wins, then Vercel's
 * production/preview hostnames, then localhost for development.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);

  const vercelHost =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_URL;
  if (vercelHost) return new URL(`https://${vercelHost}`);

  return new URL(`http://localhost:${process.env.PORT ?? "3000"}`);
}
