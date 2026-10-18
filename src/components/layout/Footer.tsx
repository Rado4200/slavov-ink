import { cacheLife } from "next/cache";

import { DiamondDivider } from "@/components/brand/DiamondDivider";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { isPlaceholder, site } from "@/content/site";
import type { SocialLink } from "@/content/site";
import { ui } from "@/content/ui";

async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
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

export function Footer() {
  const emailIsPlaceholder = isPlaceholder(site.email);

  return (
    <footer id="contact" className="mt-section border-t border-ink-line pt-16 pb-10">
      <Container>
        <div className="grid gap-12 md:grid-cols-[auto_1fr_1fr_1fr] md:gap-16">
          <Logo size="md" />

          <section aria-labelledby="footer-contact">
            <h2 id="footer-contact" className={headingClass}>
              {ui.footer.contactHeading}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                {emailIsPlaceholder ? (
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
              <li className="text-ash">{site.city}</li>
            </ul>
          </section>

          <section aria-labelledby="footer-booking">
            <h2 id="footer-booking" className={headingClass}>
              {ui.footer.bookingHeading}
            </h2>
            <p className="text-sm text-silver">{site.booking.status}</p>
            <p className="mt-2 text-sm text-ash">{site.booking.instructions}</p>
          </section>

          <section aria-labelledby="footer-social">
            <h2 id="footer-social" className={headingClass}>
              {ui.footer.socialHeading}
            </h2>
            <ul className="space-y-2 text-sm">
              {site.socials.map((link) => (
                <li key={link.label}>
                  <ExternalLink link={link} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <DiamondDivider className="mt-16 mb-6" />

        <p className="text-center text-xs text-ash">
          &copy; <CurrentYear /> {site.name}. {ui.footer.rights}
        </p>
      </Container>
    </footer>
  );
}
