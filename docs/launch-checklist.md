# Launch checklist

Everything that must change before the site goes public. Do these in order;
each env change on Vercel needs a redeploy to take effect.

## Vercel environment (Project Settings → Environment Variables)

- [ ] `SITE_INDEXING=on` for **Production** (robots.txt, `X-Robots-Tag` and meta
      robots switch to indexable; sitemap is advertised in robots.txt).
- [ ] Remove `ENABLE_DEV_ROUTES` from every environment (or leave Preview only and
      confirm Production does not have it).
- [ ] `SHOW_BUILD_STAMP=off` for **Production** (hides the footer build stamp;
      `/version.json` keeps working).
- [ ] Custom domain added under Domains, set as primary, `NEXT_PUBLIC_SITE_URL`
      set to it (canonicals, hreflang, Open Graph and sitemap use it).
- [ ] Contact form: `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`,
      `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` set and a real test message received.

## Code

- [ ] Delete the dev routes: `src/app/[locale]/dev/` (type specimens, backdrop
      playground) and the `page.dev.tsx` handling in `next.config.ts` if unused.
- [ ] Final logo package from the artist: replace `public/brand/logo-current.png`
      and `public/brand/monogram-temp.png` (vectors), update crops in
      `src/components/brand/Logo.tsx`, run `pnpm brand:icons`. Remove the TEMP notes
      in `docs/brand.md`.
- [ ] All `TODO:` copy replaced (`grep -rn "TODO:" src/messages src/content`).
- [ ] Social links and WhatsApp number set in `src/content/site.ts` (null = hidden).
- [ ] Translations native-reviewed: every row in `docs/i18n.md` set to
      `native-reviewed`.
- [ ] Re-check `experimental.globalNotFound` in `next.config.ts` against the current
      Next.js docs (still experimental? still needed?).

## Verification on production

- [ ] `pnpm deploy:verify` passes for the launch commit.
- [ ] Lighthouse (mobile) on the production domain: Performance, Accessibility,
      Best Practices and SEO all ≥ 95.
- [ ] `robots.txt` allows crawling and lists the sitemap; `/en` has no
      `noindex` meta and no `X-Robots-Tag: noindex`.
- [ ] Real-device pass with `docs/qa-checklist.md` (iPhone Safari, Android Chrome).
