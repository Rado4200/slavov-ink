import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NavLinks } from "@/components/layout/NavLinks";
import { mainNav } from "@/content/navigation";
import { ui } from "@/content/ui";

export function Header() {
  return (
    <header className="sticky top-0 z-(--z-header) border-b border-ink-line bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-header max-w-site items-center justify-between px-gutter">
        <Link href="/" aria-label={ui.homeLink} className="-my-1 block">
          <Logo size="sm" alt="" preload />
        </Link>

        <nav aria-label={ui.mainNavLabel} className="hidden md:block">
          <NavLinks
            items={mainNav}
            className="flex items-center gap-10"
            linkClassName="relative py-2 text-sm font-medium tracking-[0.2em] text-ash uppercase transition-colors duration-fast hover:text-bone aria-[current=page]:text-bone"
          />
        </nav>

        <MobileMenu items={mainNav} />
      </div>
    </header>
  );
}
