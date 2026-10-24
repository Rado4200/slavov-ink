import Link from "next/link";
import { cacheLife } from "next/cache";

import { DiamondDivider } from "@/components/brand/DiamondDivider";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { navItems } from "@/components/layout/nav-items";
import { NavLinks } from "@/components/layout/NavLinks";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { site } from "@/content/site";
import { format, getLocale, getMessages } from "@/i18n/messages";
import { localizedPath } from "@/i18n/paths";
import { shortCommit, showBuildStamp } from "@/lib/build-info";
import { socialLinks } from "@/lib/social";

async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const linkClass =
  "label-ui inline-flex min-h-11 items-center text-ash transition-colors duration-fast ease-main hover:text-bone aria-[current=page]:text-bone";

export async function Footer() {
  const locale = await getLocale();
  const m = await getMessages();
  const year = await currentYear();
  const socials = socialLinks(m.contact.whatsappMessage);

  return (
    <footer className="mt-section border-t border-ink-line bg-ink/80 pt-14 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <Container>
        <Reveal className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <Link
            href={localizedPath(locale, "/")}
            aria-label={format(m.a11y.homeLink, { brand: site.name })}
            className="block"
          >
            <Logo size="md" alt="" />
          </Link>
          <nav aria-label={m.a11y.footerNav}>
            <NavLinks
              items={navItems(locale, m)}
              className="flex flex-wrap justify-center gap-x-8"
              linkClassName={linkClass}
            />
          </nav>
          <LanguageSwitcher current={locale} label={m.a11y.languageSwitcher} />
        </Reveal>

        {socials.length > 0 ? (
          <ul className="mt-8 flex flex-wrap justify-center gap-x-8">
            {socials.map((link) => (
              <li key={link.kind}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        <DiamondDivider className="mt-12 mb-6" />

        <p className="text-center text-xs text-ash">
          {format(m.footer.copyright, { year, brand: site.name })}
        </p>
        {showBuildStamp ? (
          // Language-neutral build stamp (SHOW_BUILD_STAMP=off hides it); matches /version.json.
          <p className="mt-2 text-center text-[11px] text-ash/80 tabular-nums">{`build ${shortCommit}`}</p>
        ) : null}
      </Container>
    </footer>
  );
}
