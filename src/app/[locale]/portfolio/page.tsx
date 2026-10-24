import type { Metadata } from "next";

import { Backdrop } from "@/components/atmosphere/Backdrop";
import { PageHero } from "@/components/ui/PageHero";
import { getLocale, getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = await getMessages();
  return pageMetadata({
    locale,
    path: "/portfolio",
    title: m.portfolio.metaTitle,
    description: m.portfolio.metaDescription,
  });
}

export default async function PortfolioPage() {
  const m = await getMessages();
  return (
    <>
      <Backdrop route="portfolio" />
      <PageHero heading={m.portfolio.heading} intro={m.portfolio.intro} />
    </>
  );
}
