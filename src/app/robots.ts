import type { MetadataRoute } from "next";

import { indexingEnabled } from "@/lib/indexing";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  if (!indexingEnabled) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/*/dev/" },
    sitemap: new URL("/sitemap.xml", getSiteUrl()).toString(),
  };
}
