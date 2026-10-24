# Motion

One curve and four durations for everything (tokens in `src/styles/tokens.css`):

| Token          | Value                            | Used for                                         |
| -------------- | -------------------------------- | ------------------------------------------------ |
| `--curve-main` | `cubic-bezier(0.22, 1, 0.36, 1)` | every transition and CSS animation (`ease-main`) |
| `--dur-fast`   | 180 ms                           | hover and focus colour, button lift, nav marker  |
| `--dur-base`   | 320 ms                           | nav underline draw, mobile menu fade and slide   |
| `--dur-slow`   | 700 ms                           | section reveals                                  |
| `--dur-slower` | 1200 ms                          | backdrop fade-in after decode, glass sheen       |

Rules:

- Motion is transform and opacity only (compositor-friendly). Short hover
  colour and border-colour changes (180 ms) are state feedback, not motion.
- No animation library. CSS transitions and keyframes, plus the Web Animations
  API in the lightning engine. Framer Motion may return only via `LazyMotion` +
  `m` with a measured cost.
- Nothing animates the LCP element.

## Inventory

| Element           | Motion                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Section reveals   | 16 px lift + fade, 700 ms, children staggered 75 ms; once, when the section enters view    |
| Nav underline     | drawn from the left (scale), 320 ms on hover, keyboard focus and the current page          |
| Nav marker        | lozenge at the underline start, fades in 180 ms (main nav, mobile menu)                    |
| Language switcher | same underline as the nav, inset to the label                                              |
| Mobile menu       | dialog fades and its content slides up 12 px, 320 ms, on open and close                    |
| Contact glass     | sheen slides across on hover / focus-within (1200 ms); submit and social buttons lift 1 px |
| Smooth scroll     | Lenis, desktop only (fine pointer), lazy-loaded                                            |
| Atmosphere        | see `docs/atmosphere.md` (fade-in, draw-on, parallax, dust drift, lightning)               |

The mobile menu spec asked for 280 ms; it uses the 320 ms `--dur-base` token
instead, so the menu stays on the four-duration scale.

## Reduced motion

`prefers-reduced-motion: reduce` keeps opacity and colour fades and drops
everything that moves. `?effects=full` (session-wide) restores full motion for
review recordings.

| Element           | Default                       | Reduced motion                                     |
| ----------------- | ----------------------------- | -------------------------------------------------- |
| Section reveals   | lift + fade, staggered        | shown at once                                      |
| Nav underline     | drawn from the left           | appears without the draw                           |
| Nav marker        | 180 ms fade                   | 180 ms fade (opacity kept)                         |
| Mobile menu       | fade + 12 px slide            | fade only                                          |
| Contact glass     | sheen slide, 1 px button lift | no sheen slide, no lift                            |
| Smooth scroll     | Lenis on desktop              | native scrolling, no smooth `scroll-behavior`      |
| Backdrop fade-in  | 1200 ms after decode          | shown at once                                      |
| Draw-on diagonals | 1.1–1.6 s, 150 ms stagger     | shown complete                                     |
| Parallax          | landscape ≥ 768 px            | off                                                |
| Dust drift        | 90–110 s alternate            | off                                                |
| Lightning         | full strikes every 9–22 s     | gentle: one slow fade to 60%, 1.6 s, every 30–60 s |

## Performance (4× CPU throttle, local production build)

Measured with Playwright and CDP CPU throttling: 10 s of wheel scrolling, then
7 forced strikes over 10 s, per page, at 1440 × 900 and 390 × 844.

| Viewport | Page      | Scroll p95 | Strikes p95 | Long tasks (> 50 ms) |
| -------- | --------- | ---------- | ----------- | -------------------- |
| 1440     | Home      | 16.8 ms    | 16.7 ms     | 0                    |
| 1440     | About     | 16.7 ms    | 16.7 ms     | 0                    |
| 1440     | Portfolio | 16.7 ms    | 16.7 ms     | 0                    |
| 390      | Home      | 16.8 ms    | 16.7 ms     | 0                    |
| 390      | About     | 16.7 ms    | 16.7 ms     | 0                    |
| 390      | Portfolio | 16.7 ms    | 16.7 ms     | 0                    |

Budget: p95 ≤ 20 ms and no long tasks. Before the draw-on fix (the finished
draw windows stayed as large rotated, scaled, masked layers), Home at 1440
scrolled at p95 33.5 ms with 7 long tasks of 52–144 ms.
