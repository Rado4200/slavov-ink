import type { Metadata, Viewport } from "next";

import { LightningStorm } from "@/components/atmosphere/LightningStorm";
import { GrainOverlay } from "@/components/brand/GrainOverlay";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SkipLink } from "@/components/layout/SkipLink";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { site } from "@/content/site";
import { localeMeta, locales } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";
import { indexingEnabled } from "@/lib/indexing";
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
    robots: indexingEnabled ? { index: true, follow: true } : { index: false, follow: false },
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
      {/* No body background: <html> paints the ink, so the fixed storm layer shows through. */}
      <body className="flex min-h-dvh flex-col text-silver">
        <SkipLink targetId={MAIN_ID} label={m.a11y.skipToContent} />
        <Header />
        <LightningStorm />
        {/* Containing block for each page Backdrop, so the art spans main and footer. */}
        <div className="relative isolate flex flex-1 flex-col">
          <main id={MAIN_ID} tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
        </div>
        <GrainOverlay />
        <SmoothScroll />
      </body>
    </html>
  );
}
