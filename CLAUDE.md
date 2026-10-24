# CLAUDE.md — Slavov Ink

Portfolio website for **Slavov Ink**, a tattoo artist's studio brand.
The only brand name is **Slavov Ink**. Never use any former or alternative studio name.

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
- Never render a link or button without a real, working destination or action. Contact
  channels in `src/content/site.ts` are `null` until provided; null means hidden, never a
  dead or placeholder link.
- Mobile first. Test 360px, 768px, 1280px, 1920px.
- Lighthouse (mobile) >= 95 for Performance, Accessibility, Best Practices, SEO.
- WCAG AA contrast. Visible focus states. Full keyboard nav (including lightbox).
- Respect `prefers-reduced-motion`: disable parallax/large motion, keep opacity fades.
- Images always have width/height or aspect-ratio (no layout shift), `alt` text, lazy loading
  except the LCP image.
- No `any`, no `@ts-ignore`, no unused code, no console noise.

## Workflow rules
- Before reporting done, ALWAYS run: `pnpm lint && pnpm typecheck && pnpm i18n:check && pnpm build`.
- Small, logical commits with conventional messages (`feat:`, `fix:`, `chore:`...).
- When a requirement is ambiguous, state your assumption briefly and proceed;
  list assumptions at the end of your report.
- End every task with: what was built, files touched, how to verify, open questions.
- Do not invent business facts (address, prices, phone, bio). Use clearly marked
  placeholders in `src/content/` and list them in the report.

## i18n
- Locales: `bg`, `en`, `es`, `de`. All user-visible text lives in message files
  (`src/messages/<locale>/<namespace>.json`), never in components.
- English is the schema source of truth; every other locale must match its keys
  (enforced by `pnpm typecheck` and `pnpm i18n:check`).
- Language-neutral data (URLs, phone, coordinates) stays in `src/content/site.ts`.
- Copy placeholders (`TODO:`) for user-visible text live in `src/messages/`.

## Fonts
- Subsets: latin + latin-ext + cyrillic.
- Pirata One only for text identical in every language (brand name, numerals,
  decorative glyphs). Headings use Cormorant, body uses Manrope.

## Atmosphere
- Background art is decorative only (`aria-hidden`, no pointer events), uses palette
  tokens only, never lowers text contrast below WCAG AA, and prefers static assets
  over runtime effects.

## Contact (Phase 3 preview)
- EmailJS contact form on the homepage, WhatsApp Business link (`wa.me` with a
  localized prefilled message), Instagram and Facebook links.
- All behind abstractions so providers can be swapped.

## Next.js 16 notes
- Cache Components is on. Use `"use cache"` / `cacheLife` / `cacheTag` for data caching
  (relevant for the Drive integration), not legacy `export const revalidate`.
- Middleware is named `proxy.ts` in Next 16.
- Always check the current Next docs bundled in `node_modules/next/dist/docs` or the
  official docs before using an API.

## Git and deployment workflow
- Work directly on `main`; production deploys from `main` (Vercel). Commit small and push
  after every commit. Never push broken code.
- A pre-push hook (`.githooks/pre-push`, installed by `pnpm install` via `prepare`) runs
  `pnpm lint && pnpm typecheck && pnpm i18n:check`. Do not bypass it.
- At the end of every Part of a phase: run the full `pnpm build`, push, then `pnpm deploy:verify`
  (polls `/version.json` on production until it serves local HEAD). The footer build stamp and
  `/version.json` must match HEAD.
- If deploy verification times out, stop and ask Rado for the Vercel build log.
- If the `gh` CLI is installed and authenticated, read deployment state from the GitHub
  Deployments API for reports; otherwise write "check the Vercel dashboard".
- Never rewrite published history or force-push.
- Never store tokens in the repo. If a push needs credentials, stop and say exactly what is needed.
- Before pushing, confirm no `.env*` (other than `.env.example`) or secrets are tracked.

## JS budget
- Any new client JS above 8 KB gzipped first-load needs a written justification in the report.
- Motion may return only via `LazyMotion` + `m` components, with a measured cost.
