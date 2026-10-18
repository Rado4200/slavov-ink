import { cacheLife } from "next/cache";

import { DiamondDivider } from "@/components/brand/DiamondDivider";
import { Logo } from "@/components/brand/Logo";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { isPlaceholder, site } from "@/content/site";
import type { SocialLink } from "@/content/site";
import { format, getMessages } from "@/i18n/messages";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

function ExternalLink({ link }: { link: SocialLink }) {
  if (isPlaceholder(link.href)) {
    return <span className="text-ash">{link.label}</span>;
  }
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-silver transition-colors duration-fast hover:text-bone"
    >
      {link.label}
    </a>
  );
}

const headingClass = "mb-4 text-xs font-semibold tracking-[0.25em] text-ash uppercase";

export async function Footer() {
  const m = await getMessages();
  const year = await currentYear();

  return (
    <footer id="contact" className="mt-section border-t border-ink-line bg-ink/80 pt-16 pb-10">
      <Container>
        <Reveal className="grid gap-12 md:grid-cols-[auto_1fr_1fr_1fr] md:gap-16">
          <Logo size="md" />

          <section aria-labelledby="footer-contact">
            <h2 id="footer-contact" className={headingClass}>
              {m.footer.contactHeading}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                {isPlaceholder(site.email) ? (
                  <span className="text-ash">{site.email}</span>
                ) : (
                  <a
                    href={`mailto:${site.email}`}
                    className="text-silver transition-colors duration-fast hover:text-bone"
                  >
                    {site.email}
                  </a>
                )}
              </li>
              <li className="text-ash">{m.common.city}</li>
            </ul>
          </section>

          <section aria-labelledby="footer-booking">
            <h2 id="footer-booking" className={headingClass}>
              {m.footer.bookingHeading}
            </h2>
            <p className="text-sm text-silver">{m.footer.bookingStatus}</p>
            <p className="mt-2 text-sm text-ash">{m.footer.bookingInstructions}</p>
          </section>

          <section aria-labelledby="footer-social">
            <h2 id="footer-social" className={headingClass}>
              {m.footer.socialHeading}
            </h2>
            <ul className="space-y-2 text-sm">
              {site.socials.map((link) => (
                <li key={link.label}>
                  <ExternalLink link={link} />
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <DiamondDivider className="mt-16 mb-6" />

        <p className="text-center text-xs text-ash">
          {format(m.footer.copyright, { year, brand: site.name })}
        </p>
      </Container>
    </footer>
  );
}
