# CLAUDE.md — Slavov Ink

Portfolio website for **Slavov Ink**, a tattoo artist's studio brand.
The brand name is **Slavov Ink**. Never use "Hypnotize Ink" anywhere (code, copy, metadata, comments).

## Mission
A premium, dark, smooth, elite website. Three pages: Home, About, Portfolio.
The Portfolio is fed automatically from a Google Drive folder, so the artist
updates the site by only adding or removing files in Drive. Zero code edits for him.

## Stack
- Next.js (latest stable, App Router), TypeScript (strict), Tailwind CSS
- Framer Motion (UI animation), Lenis (smooth scroll)
- Hosting: Vercel (no custom domain yet; do not hardcode any domain)
- Package manager: pnpm
- Pin exact dependency versions. Ask before adding any dependency not listed here.

## Brand (source of truth: `docs/brand.md`, generated from the logo)
- Logo asset: `public/brand/` (current file is a raster on black; the artist is
  reworking it into one unified brand, so the logo MUST be swappable by replacing
  one file and editing one component: `src/components/brand/Logo.tsx`).
- Palette (approximate until sampled; final values live in `src/styles/tokens.css`):
  - Ink black ~ #050505 (base background)
  - Royal purple ~ #5B0FC0 (primary accent)
  - Deep violet ~ #2B0B4F (shadows, gradients, subtle surfaces)
  - Bone white ~ #EDEDED, ash grey ~ #A8A8A8 (text, grunge highlights)
- Motifs from the logo: gothic blackletter monogram, offset purple shadow,
  distressed/grunge texture on white, small diamond (lozenge) bullets.
- Never introduce new hues outside this palette. No gradients that are not purple-to-black.

## Architecture rules
- `src/app/` routes only. Keep pages thin.
- `src/components/` UI, grouped by feature (`brand`, `layout`, `portfolio`, `ui`).
- `src/lib/drive/` ALL Google Drive logic. Server-only (`import "server-only"`).
  Normalize Drive output to our own `PortfolioItem` / `PortfolioCategory` types.
  The rest of the app must never know Drive exists.
- `src/content/` all editable copy (bio, tagline, contact, FAQ) in typed TS files.
  No copy hardcoded inside components.
- `src/styles/tokens.css` design tokens as CSS variables, mapped in Tailwind config.
- Secrets only via env vars. Maintain `.env.example`. Never commit `.env*`.

## Google Drive integration rules
- API key / service account credentials are server-side only, never in client bundles.
- Never hotlink Drive image URLs in the browser (they expire / rate-limit).
  Fetch server-side, optimize (WebP/AVIF, multiple widths), cache, serve ours.
- Subfolders of the root folder = portfolio categories. Image filename = optional title.
- Handle: HEIC, huge files, non-image files, empty folders, API errors/quota.
- Strip EXIF (especially GPS) from every served image.
- Revalidate on a timer (ISR) plus a secret-protected on-demand revalidate route.
- If env vars are missing or Drive fails: fall back to last cached data, then to
  local sample images in `public/sample/`. The site must never show a broken page.

## Quality bar (non-negotiable)
- Mobile first. Test 360px, 768px, 1280px, 1920px.
- Lighthouse (mobile) >= 95 for Performance, Accessibility, Best Practices, SEO.
- WCAG AA contrast. Visible focus states. Full keyboard nav (including lightbox).
- Respect `prefers-reduced-motion`: disable parallax/large motion, keep opacity fades.
- Images always have width/height or aspect-ratio (no layout shift), `alt` text, lazy loading
  except the LCP image.
- No `any`, no `@ts-ignore`, no unused code, no console noise.

## Workflow rules
- Before reporting done, ALWAYS run: `pnpm lint && pnpm typecheck && pnpm build`.
- Small, logical commits with conventional messages (`feat:`, `fix:`, `chore:`...).
- When a requirement is ambiguous, state your assumption briefly and proceed;
  list assumptions at the end of your report.
- End every task with: what was built, files touched, how to verify, open questions.
- Do not invent business facts (address, prices, phone, bio). Use clearly marked
  placeholders in `src/content/` and list them in the report.