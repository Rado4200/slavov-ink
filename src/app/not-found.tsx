import type { Metadata } from "next";
import Link from "next/link";

import { DiamondDivider } from "@/components/brand/DiamondDivider";
import { Container } from "@/components/ui/Container";
import { ui } from "@/content/ui";

export const metadata: Metadata = {
  title: ui.notFound.title,
};

export default function NotFound() {
  return (
    <section className="bg-veil pt-section pb-16">
      <Container className="flex flex-col items-center text-center">
        <p
          aria-hidden="true"
          className="font-display text-8xl text-bone text-shadow-echo sm:text-9xl"
        >
          {ui.notFound.code}
        </p>
        <h1 className="mt-6 font-heading text-4xl font-medium text-bone sm:text-5xl">
          {ui.notFound.heading}
        </h1>
        <DiamondDivider variant="triple" className="my-8 max-w-xs" />
        <p className="text-silver">{ui.notFound.body}</p>
        <Link
          href="/"
          className="mt-10 inline-flex min-h-11 items-center border border-royal px-6 text-sm font-semibold tracking-[0.2em] text-bone uppercase shadow-echo transition-shadow duration-base hover:shadow-glow"
        >
          {ui.notFound.cta}
        </Link>
      </Container>
    </section>
  );
}
