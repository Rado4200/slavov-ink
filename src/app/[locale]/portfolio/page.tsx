import type { Metadata } from "next";

import { PageHero } from "@/components/ui/PageHero";
import { portfolioPage } from "@/content/pages";

export const metadata: Metadata = {
  title: portfolioPage.title,
  description: portfolioPage.description,
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return <PageHero content={portfolioPage} />;
}
