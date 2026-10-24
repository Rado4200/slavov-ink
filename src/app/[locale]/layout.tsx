import type { Metadata, Viewport } from "next";

import { Dust } from "@/components/atmosphere/Backdrop";
import { LightningStorm } from "@/components/atmosphere/LightningStorm";
import { GrainOverlay } from "@/components/brand/GrainOverlay";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SkipLink } from "@/components/layout/SkipLink";
import { Effects } from "@/components/motion/Effects";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { site } from "@/content/site";
import { localeMeta, locales } from "@/i18n/config";
import { getLocale, getMessages } from "@/i18n/messages";
import { indexingEnabled } from "@/lib/indexing";
import { getSiteUrl } from "@/lib/site-url";
import { fontVariables } from "@/styles/fonts";

import "../globals.css";

const MAIN_ID = "main";

/**
 * Review aid: ?effects=full forces the full storm and animations for this
 * session even under reduced motion. Runs before first paint (no flash).
 * Not linked anywhere.
 */
const EFFECTS_SCRIPT = `try{var q=new URLSearchParams(location.search).get("effects");if(q==="full")sessionStorage.setItem("slavov-ink:effects","full");if(sessionStorage.getItem("slavov-ink:effects")==="full")document.documentElement.dataset.effects="full"}catch(e){}`;

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
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const m = await getMessages();

  return (
    // suppressHydrationWarning: the effects script may add data-effects before hydration.
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: EFFECTS_SCRIPT }} />
      </head>
      {/* No body background: <html> paints the ink, so the fixed storm layer shows through. */}
      <body className="flex min-h-dvh flex-col text-silver">
        <SkipLink targetId={MAIN_ID} label={m.a11y.skipToContent} />
        <Header />
        <Dust />
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
        <Effects />
      </body>
    </html>
  );
}
