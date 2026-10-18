import type { ReactNode } from "react";

import { DiamondDivider } from "@/components/brand/DiamondDivider";
import { Container } from "@/components/ui/Container";

type PageHeroProps = {
  /** Text, or a logo image for the home page. */
  heading: ReactNode;
  intro: string;
};

export function PageHero({ heading, intro }: PageHeroProps) {
  return (
    <section className="pt-section pb-16">
      <Container className="flex flex-col items-center text-center">
        <h1 className="font-heading text-5xl font-medium text-balance text-bone sm:text-7xl">
          {heading}
        </h1>
        <DiamondDivider variant="triple" className="my-8 max-w-xs" />
        <p className="max-w-prose text-base text-silver sm:text-lg">{intro}</p>
      </Container>
    </section>
  );
}
