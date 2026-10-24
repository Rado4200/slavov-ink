/*
 * TEMPORARY typography specimen. REMOVE BEFORE LAUNCH (see docs/launch-checklist.md).
 * The .dev.tsx extension keeps it out of production builds; see next.config.ts.
 * Sample strings live here, not in src/messages/, because this is dev tooling.
 */
import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Type specimen (dev)",
  robots: { index: false, follow: false },
};

/** Each sample exercises the language's special glyphs at every level. */
const SAMPLES: Record<Locale, { h1: string; h2: string; h3: string; body: string; nav: string[] }> =
  {
    en: {
      h1: "Black ink, sharp lines",
      h2: "Every piece starts with a conversation",
      h3: "Placement and size",
      body: "Bring your idea, references and placement; we refine the design together until it is ready for skin.",
      nav: ["Home", "About", "Portfolio"],
    },
    bg: {
      h1: "Черно мастило, щрих по щрих: ЪЬЮЯЖЦЩ",
      h2: "Всяка татуировка започва с разговор",
      h3: "Място и размер: ъгъл, ьо, юмрук, ябълка",
      body: "Донесете идея, референции и място — ще изгладим дизайна заедно, щрих по щрих: жест, цвят, щастие.",
      nav: ["Начало", "За мен", "Портфолио"],
    },
    es: {
      h1: "Tinta negra, ¿líneas? ¡Ñandú! Pingüino",
      h2: "Cada pieza empieza con una conversación",
      h3: "Ubicación y tamaño: añade referencias",
      body: "¿Tienes una idea? ¡Cuéntamela! Diseño, tamaño y ubicación; el pingüino también vale, sin vergüenza.",
      nav: ["Inicio", "Sobre mí", "Portafolio"],
    },
    de: {
      h1: "Schwarze Tinte: Größe, Übergänge, Äußerst",
      h2: "Jedes Tattoo beginnt mit einem Gespräch",
      h3: "Größe und Körperstelle",
      body: "Äußerst präzise Übergänge, schöne Schattierungen und Nachsorge gehören dazu. Öl, Übung, Maß.",
      nav: ["Start", "Über mich", "Portfolio"],
    },
  };

const LONG_WORDS = ["Datenschutzerklärung", "Tätowierungen", "Tätowierungsnachsorgeempfehlungen"];

const sectionTitle = "label-ui text-ash";

export default function TypeSpecimenPage() {
  return (
    <Container className="py-16">
      <p className={sectionTitle}>Dev · type specimen (noindex)</p>
      <p className="mt-2 max-w-prose text-sm text-ash">
        Final system: Playfair Display headings (H1 800 uppercase 0.05em, H2/H3 700), Manrope body,
        Manrope 600 uppercase labels. Pirata One is used only for the 404 numerals.
      </p>

      {locales.map((locale) => {
        const s = SAMPLES[locale];
        return (
          <section
            key={locale}
            lang={locale}
            aria-label={locale}
            className="mt-16 border-t border-ink-line pt-10"
          >
            <p className={sectionTitle}>{locale}</p>
            <h1 className="mt-4 text-bone">{s.h1}</h1>
            <h2 className="mt-6 text-bone">{s.h2}</h2>
            <h3 className="mt-4 text-bone">{s.h3}</h3>
            <p className="mt-4 max-w-prose text-silver">{s.body}</p>
            <ul className="mt-6 flex flex-wrap gap-6">
              {s.nav.map((item) => (
                <li key={item} className="label-ui text-silver">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section
        lang="de"
        aria-label="German long words"
        className="mt-16 border-t border-ink-line pt-10"
      >
        <p className={sectionTitle}>
          German H1 stress test (column = 360px viewport minus gutters)
        </p>
        <div data-stress className="mt-6 border border-ink-line p-4" style={{ maxWidth: 328 }}>
          {LONG_WORDS.map((word) => (
            <h1 key={word} className="mt-4 text-bone">
              {word}
            </h1>
          ))}
        </div>
      </section>
    </Container>
  );
}
