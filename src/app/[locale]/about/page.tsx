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
    path: "/about",
    title: m.about.metaTitle,
    description: m.about.metaDescription,
  });
}

export default async function AboutPage() {
  const m = await getMessages();
  return (
    <>
      <Backdrop route="about" />
      <PageHero heading={m.about.heading} intro={m.about.intro} />
    </>
  );
}
