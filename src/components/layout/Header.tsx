import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { navItems } from "@/components/layout/nav-items";
import { NavLinks } from "@/components/layout/NavLinks";
import { site } from "@/content/site";
import { format, getLocale, getMessages } from "@/i18n/messages";
import { localizedPath } from "@/i18n/paths";

export async function Header() {
  const locale = await getLocale();
  const m = await getMessages();
  const items = navItems(locale, m);

  return (
    <header className="sticky top-0 z-(--z-header) border-b border-ink-line bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-header max-w-site items-center justify-between gap-4 px-gutter">
        <Link
          href={localizedPath(locale, "/")}
          aria-label={format(m.a11y.homeLink, { brand: site.name })}
          className="block shrink-0"
        >
          <Logo variant="monogram" size="xs" alt="" preload />
        </Link>

        <div className="flex items-center gap-4 lg:gap-10">
          <nav aria-label={m.a11y.mainNav} className="hidden md:block">
            <NavLinks
              items={items}
              className="flex items-center gap-6 lg:gap-10"
              linkClassName="label-ui relative py-2 whitespace-nowrap text-ash transition-colors duration-fast ease-main hover:text-bone aria-[current=page]:text-bone"
            />
          </nav>

          <LanguageSwitcher current={locale} label={m.a11y.languageSwitcher} />

          <MobileMenu
            items={items}
            labels={{
              dialog: m.a11y.mobileNav,
              nav: m.a11y.mainNav,
              open: m.a11y.openMenu,
              close: m.a11y.closeMenu,
            }}
            footer={<LanguageSwitcher current={locale} label={m.a11y.languageSwitcher} />}
          />
        </div>
      </div>
    </header>
  );
}
