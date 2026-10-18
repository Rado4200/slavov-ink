import type { Metadata } from "next";

import { Backdrop } from "@/components/atmosphere/Backdrop";
import { Logo } from "@/components/brand/Logo";
import { PageHero } from "@/components/ui/PageHero";
import { site } from "@/content/site";
import { format, getLocale, getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = await getMessages();
  return pageMetadata({
    locale,
    path: "/",
    title: format(m.home.metaTitle, { brand: site.name }),
    description: m.home.metaDescription,
    absoluteTitle: true,
  });
}

export default async function HomePage() {
  const m = await getMessages();
  return (
    <div className="relative isolate">
      <Backdrop variant="home" />
      <PageHero heading={<Logo size="lg" preload />} intro={m.home.intro} />
    </div>
  );
}
