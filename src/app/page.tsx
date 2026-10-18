import type { Metadata } from "next";

import { PageHero } from "@/components/ui/PageHero";
import { homePage } from "@/content/pages";

export const metadata: Metadata = {
  title: { absolute: homePage.title },
  description: homePage.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <PageHero content={homePage} display />;
}
