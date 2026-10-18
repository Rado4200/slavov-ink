import { DiamondDivider } from "@/components/brand/DiamondDivider";
import { Container } from "@/components/ui/Container";
import type { PageContent } from "@/content/pages";

type PageHeroProps = {
  content: Pick<PageContent, "heading" | "intro">;
  /** Blackletter display face, reserved for the home page. */
  display?: boolean;
};

export function PageHero({ content, display = false }: PageHeroProps) {
  return (
    <section className="bg-veil pt-section pb-16">
      <Container className="flex flex-col items-center text-center">
        <h1
          className={
            display
              ? "font-display text-6xl text-bone text-shadow-echo sm:text-8xl"
              : "font-heading text-5xl font-medium text-bone sm:text-7xl"
          }
        >
          {content.heading}
        </h1>
        <DiamondDivider variant="triple" className="my-8 max-w-xs" />
        <p className="max-w-prose text-base text-silver sm:text-lg">{content.intro}</p>
      </Container>
    </section>
  );
}
