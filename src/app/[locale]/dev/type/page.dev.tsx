/*
 * TEMPORARY typography comparison route. REMOVE BEFORE LAUNCH
 * (delete the src/app/[locale]/dev/type/ folder once the font pairing is final).
 * The .dev.tsx extension keeps it out of production builds; see next.config.ts.
 * Sample strings live here, not in src/messages/, because this is dev tooling.
 */
import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";

import { bodyCandidates, displayCandidates, headingCandidates } from "./candidates";
import type { FontCandidate } from "./candidates";

export const metadata: Metadata = {
  title: "Type specimens (dev)",
  robots: { index: false, follow: false },
};

/** Each sample exercises the language's special glyphs. */
const SAMPLES: Record<Locale, { heading: string; body: string }> = {
  en: {
    heading: "Black ink, sharp lines, permanent work",
    body: "Every piece starts with a conversation. Bring your idea, references and placement; we refine the design together until it is ready for skin.",
  },
  bg: {
    heading: "Черно мастило, остри линии, вечна работа",
    body: "Всяка татуировка започва с разговор. Донесете идея, референции и място — ще изгладим дизайна заедно, щрих по щрих: ъгъл, ьо, юмрук, ябълка, жест, цвят.",
  },
  es: {
    heading: "Tinta negra, líneas precisas, obra para siempre",
    body: "¿Tienes una idea? ¡Cuéntamela! Cada pieza empieza con una conversación: diseño, tamaño y ubicación. Añade referencias sin vergüenza; el pingüino también vale.",
  },
  de: {
    heading: "Schwarze Tinte, klare Linien, bleibende Kunst",
    body: "Jedes Tattoo beginnt mit einem Gespräch über Größe, Stil und Körperstelle. Äußerst präzise Übergänge, schöne Schattierungen und Nachsorge gehören dazu.",
  },
};

const LONG_WORDS = [
  "Datenschutzerklärung",
  "Tätowierungen",
  "Terminvereinbarung",
  "Tätowierungsnachsorgeempfehlungen",
];

const INVARIANT_DISPLAY = "Slavov Ink 404 1234567890 ◆";

function Tag({ font }: { font: FontCandidate }) {
  return (
    <span className={font.current ? "text-royal-light" : "text-ash"}>
      {font.name}
      {font.current ? " (current)" : ""}
    </span>
  );
}

const sectionTitle = "text-xs font-semibold tracking-[0.25em] text-ash uppercase";

export default function TypeSpecimensPage() {
  const pairs = headingCandidates.flatMap((heading) =>
    bodyCandidates.map((body) => ({ heading, body })),
  );

  return (
    <Container className="py-16">
      <h1 className="font-heading text-4xl text-bone">Type specimens</h1>
      <p className="mt-2 text-sm text-ash">
        Temporary dev route (noindex). Each heading/body pair in all four languages, the display
        faces with language-invariant text only, and a German long-word stress test.
      </p>

      <section aria-labelledby="display" className="mt-12">
        <h2 id="display" className={sectionTitle}>
          Display (language-invariant text only, no Cyrillic)
        </h2>
        <ul className="mt-6 grid gap-6 md:grid-cols-3">
          {displayCandidates.map((font) => (
            <li key={font.name} className="border border-ink-line bg-ink-raised p-6">
              <p className="text-xs">
                <Tag font={font} />
              </p>
              <p
                className="mt-3 text-4xl text-bone text-shadow-echo"
                style={{ fontFamily: font.family }}
              >
                {INVARIANT_DISPLAY}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pairs" className="mt-16">
        <h2 id="pairs" className={sectionTitle}>
          Heading / body pairs in BG · EN · ES · DE
        </h2>
        <ul className="mt-6 grid gap-6 xl:grid-cols-2">
          {pairs.map(({ heading, body }) => (
            <li
              key={`${heading.name}-${body.name}`}
              className={[
                "border bg-ink-raised p-6 sm:p-8",
                heading.current && body.current ? "border-royal shadow-glow" : "border-ink-line",
              ].join(" ")}
            >
              <p className="text-xs">
                <Tag font={heading} /> / <Tag font={body} />
                {heading.cyrillic ? null : (
                  <span className="text-bone"> · heading has no Cyrillic (BG falls back)</span>
                )}
              </p>
              {locales.map((locale) => (
                <div key={locale} lang={locale} className="mt-6">
                  <p className="text-xs font-semibold tracking-[0.2em] text-ash uppercase">
                    {locale}
                  </p>
                  <p className="mt-1 text-3xl text-bone" style={{ fontFamily: heading.family }}>
                    {SAMPLES[locale].heading}
                  </p>
                  <p className="mt-2 text-base text-silver" style={{ fontFamily: body.family }}>
                    {SAMPLES[locale].body}
                  </p>
                </div>
              ))}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stress" lang="de" className="mt-16">
        <h2 id="stress" className={sectionTitle}>
          German long words in narrow columns (hyphens: auto)
        </h2>
        <div className="mt-6 flex flex-wrap gap-6">
          {[140, 200, 280].map((width) => (
            <div key={width} className="border border-ink-line bg-ink-raised p-4" style={{ width }}>
              <p className="text-xs text-ash">{width}px</p>
              {LONG_WORDS.map((word) => (
                <p key={word} className="mt-3 font-heading text-2xl text-bone">
                  {word}
                </p>
              ))}
              <p className="mt-3 text-sm text-silver">{LONG_WORDS.join(" ")}</p>
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}
