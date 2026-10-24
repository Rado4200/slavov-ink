import type { ReactNode } from "react";

import { DiamondDivider } from "@/components/brand/DiamondDivider";
import { Container } from "@/components/ui/Container";

type PageHeroProps = {
  /** Heading text, or (home) visually hidden text plus the logo as the visual. */
  heading: ReactNode;
  intro: string;
};

export function PageHero({ heading, intro }: PageHeroProps) {
  return (
    <section className="pt-section pb-16">
      <Container className="flex flex-col items-center text-center">
        <h1 className="text-balance text-bone">{heading}</h1>
        <DiamondDivider variant="triple" className="my-8 max-w-xs" />
        <p className="max-w-prose text-base text-silver sm:text-lg">{intro}</p>
      </Container>
    </section>
  );
}
