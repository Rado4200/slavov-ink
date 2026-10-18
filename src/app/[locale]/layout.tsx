import type { Metadata, Viewport } from "next";

import { GrainOverlay } from "@/components/brand/GrainOverlay";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SkipLink } from "@/components/layout/SkipLink";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { site } from "@/content/site";
import { localeMeta, locales } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";
import { getSiteUrl } from "@/lib/site-url";
import { fontVariables } from "@/styles/fonts";

import "../globals.css";

const MAIN_ID = "main";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = await getMessages();
  return {
    metadataBase: getSiteUrl(),
    title: { default: site.name, template: `%s | ${site.name}` },
    description: m.common.description,
    applicationName: site.name,
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: localeMeta[locale].ogLocale,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const m = await getMessages();

  return (
    <html lang={locale} className={fontVariables}>
      <body className="flex min-h-dvh flex-col bg-ink text-silver">
        <SkipLink targetId={MAIN_ID} label={m.a11y.skipToContent} />
        <Header />
        <main id={MAIN_ID} tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
        <GrainOverlay />
        <SmoothScroll />
      </body>
    </html>
  );
}
