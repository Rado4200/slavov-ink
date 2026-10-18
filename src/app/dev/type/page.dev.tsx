/*
 * TEMPORARY typography comparison route. REMOVE BEFORE LAUNCH
 * (delete the src/app/dev/ folder once the font pairing is final).
 * The .dev.tsx extension keeps it out of production builds; see next.config.ts.
 * Sample strings live here, not in src/content/, because this is dev tooling.
 */
import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";

import { bodyCandidates, displayCandidates, headingCandidates } from "./candidates";
import type { FontCandidate } from "./candidates";

export const metadata: Metadata = {
  title: "Type specimens (dev)",
  robots: { index: false, follow: false },
};

const SAMPLE_DISPLAY = "Slavov Ink";
const SAMPLE_HEADING = "Black ink, sharp lines, permanent work";
const SAMPLE_BODY =
  "Every piece starts with a conversation. Bring your idea, references and placement; we refine the design together until it is ready for skin. Healed results are what matter.";

const combos = displayCandidates.flatMap((display) =>
  headingCandidates.flatMap((heading) =>
    bodyCandidates.map((body) => ({ display, heading, body })),
  ),
);

function Tag({ font }: { font: FontCandidate }) {
  return (
    <span className={font.current ? "text-royal-light" : "text-ash"}>
      {font.name}
      {font.current ? " (current)" : ""}
    </span>
  );
}

export default function TypeSpecimensPage() {
  return (
    <Container className="py-16">
      <h1 className="font-heading text-4xl text-bone">Type specimens</h1>
      <p className="mt-2 text-sm text-ash">
        Temporary dev route (noindex). Compare the candidates, then pick one per role.
      </p>

      <section aria-labelledby="singles" className="mt-12">
        <h2 id="singles" className="text-xs font-semibold tracking-[0.25em] text-ash uppercase">
          Individual faces
        </h2>
        <ul className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[...displayCandidates, ...headingCandidates, ...bodyCandidates].map((font) => (
            <li key={font.name} className="border border-ink-line bg-ink-raised p-6">
              <p className="text-xs">
                <Tag font={font} />
              </p>
              <p className="mt-3 text-4xl text-bone" style={{ fontFamily: font.family }}>
                {SAMPLE_DISPLAY}
              </p>
              <p className="mt-2 text-sm text-silver" style={{ fontFamily: font.family }}>
                ABCDEFGHIJKLM abcdefghijklm 0123456789
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="combos" className="mt-16">
        <h2 id="combos" className="text-xs font-semibold tracking-[0.25em] text-ash uppercase">
          Combinations (display / heading / body)
        </h2>
        <ul className="mt-6 grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          {combos.map(({ display, heading, body }) => (
            <li
              key={`${display.name}-${heading.name}-${body.name}`}
              className={[
                "border bg-ink-raised p-8",
                display.current && heading.current && body.current
                  ? "border-royal shadow-glow"
                  : "border-ink-line",
              ].join(" ")}
            >
              <p className="text-xs">
                <Tag font={display} /> / <Tag font={heading} /> / <Tag font={body} />
              </p>
              <p
                className="mt-6 text-6xl text-bone text-shadow-echo"
                style={{ fontFamily: display.family }}
              >
                {SAMPLE_DISPLAY}
              </p>
              <p className="mt-6 text-3xl text-bone" style={{ fontFamily: heading.family }}>
                {SAMPLE_HEADING}
              </p>
              <p className="mt-4 text-base text-silver" style={{ fontFamily: body.family }}>
                {SAMPLE_BODY}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
