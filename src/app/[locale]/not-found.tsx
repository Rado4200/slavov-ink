import type { Metadata } from "next";
import Link from "next/link";

import { DiamondDivider } from "@/components/brand/DiamondDivider";
import { Container } from "@/components/ui/Container";
import { getLocale, getMessages } from "@/i18n/messages";
import { localizedPath } from "@/i18n/paths";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages();
  return { title: m.notFound.metaTitle };
}

export default async function NotFound() {
  const locale = await getLocale();
  const m = await getMessages();

  return (
    <section className="bg-veil pt-section pb-16">
      <Container className="flex flex-col items-center text-center">
        <p
          aria-hidden="true"
          className="font-display text-8xl text-bone text-shadow-echo sm:text-9xl"
        >
          {m.notFound.code}
        </p>
        <h1 className="mt-6 text-balance text-bone">{m.notFound.heading}</h1>
        <DiamondDivider variant="triple" className="my-8 max-w-xs" />
        <p className="text-silver">{m.notFound.body}</p>
        <Link
          href={localizedPath(locale, "/")}
          className="mt-10 inline-flex min-h-11 items-center border border-royal px-6 label-ui text-bone shadow-echo transition-shadow duration-base ease-main hover:shadow-glow"
        >
          {m.notFound.cta}
        </Link>
      </Container>
    </section>
  );
}
