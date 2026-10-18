import type { Metadata, Viewport } from "next";

import { GrainOverlay } from "@/components/brand/GrainOverlay";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SkipLink } from "@/components/layout/SkipLink";
import { site } from "@/content/site";
import { getSiteUrl } from "@/lib/site-url";
import { fontVariables } from "@/styles/fonts";

import "./globals.css";

const MAIN_ID = "main";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: site.name,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-dvh flex-col bg-ink text-silver">
        <SkipLink targetId={MAIN_ID} />
        <Header />
        <main id={MAIN_ID} tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
        <GrainOverlay />
      </body>
    </html>
  );
}
