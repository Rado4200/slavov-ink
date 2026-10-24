import { buildInfo } from "@/lib/build-info";

/*
 * /version.json: which build is being served. Prerendered at build time (no
 * runtime data), so each deploy serves its own values. Cache-Control: no-store
 * and X-Robots-Tag: noindex are set in next.config.ts headers().
 */
export function GET() {
  return Response.json(buildInfo, {
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
