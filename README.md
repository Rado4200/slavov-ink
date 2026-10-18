# Slavov Ink

Portfolio website for the Slavov Ink tattoo studio. Dark, premium, three pages
(Home, About, Portfolio). The portfolio will be fed automatically from a
Google Drive folder.

Built with Next.js (App Router, Cache Components), TypeScript (strict),
Tailwind CSS v4 and pnpm. Hosted on Vercel.

## Setup

Requirements: Node.js 20.19+ (see `.nvmrc`) and pnpm 10 (pinned in `package.json`).

```sh
corepack enable        # once per machine; provides the pinned pnpm
pnpm install
cp .env.example .env.local   # optional in Phase 1, nothing requires it yet
pnpm dev               # http://localhost:3000
```

If you would rather not run `corepack enable`, prefix commands with
`corepack`, for example `corepack pnpm dev`.

## Scripts

| Script              | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `pnpm dev`          | Development server                                        |
| `pnpm build`        | Production build                                          |
| `pnpm start`        | Serve the production build                                |
| `pnpm lint`         | ESLint, fails on any warning                              |
| `pnpm typecheck`    | Generate route types, then `tsc --noEmit`                 |
| `pnpm format`       | Prettier (with Tailwind class sorting), write             |
| `pnpm format:check` | Prettier, check only                                      |
| `pnpm brand:colors` | Re-sample the palette from the logo (see `docs/brand.md`) |
| `pnpm brand:icons`  | Regenerate favicon and Apple touch icon from the logo     |

Before every commit or deploy: `pnpm lint && pnpm typecheck && pnpm build`.

## Structure

```
src/
  app/                 Routes only, pages stay thin
    dev/type/          TEMPORARY font comparison page (dev only), delete before launch
  components/
    brand/             Logo (single source), GrainOverlay, DiamondDivider
    layout/            Header, MobileMenu, Footer, SkipLink
    portfolio/         Gallery components (Phase 4+)
    ui/                Generic building blocks
  content/             All editable copy, typed (site facts, nav, page text)
  lib/
    drive/             All Google Drive logic, server-only (Phase 4)
  styles/
    tokens.css         Design tokens (CSS variables)
    fonts.ts           next/font setup
public/
  brand/               Logo files
  sample/              Fallback portfolio images (used when Drive is unavailable)
docs/brand.md          Sampled palette, logo anatomy, usage rules
scripts/               Dev tooling (brand colour extraction)
```

Design tokens live in `src/styles/tokens.css` and are mapped to Tailwind
utilities in `src/app/globals.css` (`bg-ink`, `text-bone`, `text-royal-light`,
`shadow-glow`, `text-shadow-echo` ...). Tailwind's default colours are disabled
on purpose: only brand colours exist.

### Editing content

All text lives in `src/content/`. Placeholders waiting for real information
are clearly marked at the start of the string; search `src/content/` for them.

### Replacing the logo

Put the new file in `public/brand/`, then update the import and `LOGO_CROP` in
`src/components/brand/Logo.tsx`. Nothing else references the logo file.
Then run `pnpm brand:icons` to regenerate the favicon and Apple touch icon
(`src/app/icon.png`, `src/app/apple-icon.png`) and `pnpm brand:colors` to
re-check the palette.

### Dev-only routes

`/dev/type` compares font candidates. Files named `page.dev.tsx` exist only in
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
