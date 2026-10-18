# Slavov Ink

Portfolio website for the Slavov Ink tattoo studio. Dark, premium, three pages
(Home, About, Portfolio) in four languages (BG, EN, ES, DE). The portfolio will
be fed automatically from a Google Drive folder.

Built with Next.js (App Router, Cache Components), TypeScript (strict),
Tailwind CSS v4 and pnpm. Hosted on Vercel.

## Setup

Requirements: Node.js 20.19+ (see `.nvmrc`) and pnpm 10 (pinned in `package.json`).

```sh
corepack enable        # once per machine; provides the pinned pnpm
pnpm install
cp .env.example .env.local   # optional in Phase 1, nothing requires it yet
pnpm dev               # http://localhost:3000 (redirects to /en, /bg, /es or /de)
```

If you would rather not run `corepack enable`, prefix commands with
`corepack`, for example `corepack pnpm dev`.

## Scripts

| Script                              | What it does                                               |
| ----------------------------------- | ---------------------------------------------------------- |
| `pnpm dev`                          | Development server                                         |
| `pnpm build`                        | Production build                                           |
| `pnpm start`                        | Serve the production build                                 |
| `pnpm lint`                         | ESLint, fails on any warning                               |
| `pnpm typecheck`                    | Generate route types, then `tsc --noEmit`                  |
| `pnpm format`                       | Prettier (with Tailwind class sorting), write              |
| `pnpm format:check`                 | Prettier, check only                                       |
| `pnpm brand:colors`                 | Re-sample the palette from the logo (see `docs/brand.md`)  |
| `pnpm brand:icons`                  | Regenerate favicon and Apple touch icon from the monogram  |
| `pnpm i18n:check`                   | Validate translations against English (CI-ready exit code) |
| `pnpm backdrop:generate [--seed N]` | Regenerate the ink-atmosphere art (see `docs/brand.md`)    |

Before every commit or deploy: `pnpm lint && pnpm typecheck && pnpm i18n:check && pnpm build`.

## Structure

```
src/
  proxy.ts             Locale redirect for URLs without a locale
  app/                 Routes only, pages stay thin
    [locale]/          Every page, statically generated per locale
      dev/type/        TEMPORARY font comparison (dev only), delete before launch
      dev/backdrop/    TEMPORARY backdrop playground (dev only), delete before launch
    global-not-found.tsx, sitemap.ts, robots.ts, icons
  components/
    atmosphere/        Backdrop (ink background art), composition, flash
    brand/             Logo (single source), GrainOverlay, DiamondDivider
    layout/            Header, LanguageSwitcher, MobileMenu, Footer, SkipLink
    motion/            Reveal, SmoothScroll (Lenis)
    portfolio/         Gallery components (Phase 4+)
    ui/                Generic building blocks
  content/             Language-neutral data (site facts, nav structure)
  i18n/                Locale config, negotiation, messages, metadata helpers
  messages/<locale>/   All user-visible text, one JSON file per namespace
  lib/
    drive/             All Google Drive logic, server-only (Phase 4)
    motion/            Motion tokens, variants, reduced-motion helper
  styles/
    tokens.css         Design tokens (CSS variables)
    fonts.ts           next/font setup
public/
  backdrop/            Generated atmosphere art (pnpm backdrop:generate)
  brand/               Logo files (TEMP until the artist delivers vectors)
  sample/              Fallback portfolio images (used when Drive is unavailable)
docs/brand.md          Palette, logo, TEMP assets, typography, atmosphere
docs/i18n.md           i18n decision, architecture, translation status
docs/review/           Screenshots for design review, per phase
scripts/               Dev tooling (colours, icons, backdrop, i18n check)
```

Design tokens live in `src/styles/tokens.css` and are mapped to Tailwind
utilities in `src/app/globals.css` (`bg-ink`, `text-bone`, `text-royal-light`,
`shadow-glow`, `text-shadow-echo` ...). Tailwind's default colours are disabled
on purpose: only brand colours exist.

### Editing content

User-visible text lives in `src/messages/<locale>/` (see `docs/i18n.md`);
language-neutral facts (email, social URLs) in `src/content/site.ts`.
Placeholders waiting for real information start with `TODO:`.

### Replacing the logo

See "TEMP assets" in `docs/brand.md`: replace the files in `public/brand/`,
update the imports and crops in `src/components/brand/Logo.tsx` (nothing else
references them), then run `pnpm brand:icons` and `pnpm brand:colors`.

### Dev-only routes

`/en/dev/type` compares font candidates in all four languages;
`/en/dev/backdrop` is the background-art playground. Files named `page.dev.tsx` exist only in
`pnpm dev`; to include them in a build (for example a Vercel preview), set
`ENABLE_DEV_ROUTES=1`. Never set it in production.

## Deployment (Vercel)

1. Import the Git repository in Vercel. The framework (Next.js) and pnpm are
   detected automatically from `package.json` and `pnpm-lock.yaml`.
2. Add the environment variables from `.env.example` in
   Project Settings > Environment Variables (not needed until Phase 4).
3. Every push to the main branch deploys to production; other branches and pull
   requests get preview URLs.

No domain is hardcoded. Metadata URLs use `NEXT_PUBLIC_SITE_URL` when set,
otherwise the Vercel deployment URL.

## How the artist updates the portfolio

_Coming in Phase 4._ The plan: add or remove images in the shared Google Drive
folder (one subfolder per category) and the site picks the changes up on its own,
with no code edits.
