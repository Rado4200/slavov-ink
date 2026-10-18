import type { Metadata } from "next";

import { PageHero } from "@/components/ui/PageHero";
import { aboutPage } from "@/content/pages";

export const metadata: Metadata = {
  title: aboutPage.title,
  description: aboutPage.description,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <PageHero content={aboutPage} />;
}
