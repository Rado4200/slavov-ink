"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLinkItem = {
  /** Localized href, e.g. "/bg/about". */
  href: string;
  label: string;
};

type NavLinksProps = {
  items: NavLinkItem[];
  className?: string;
  linkClassName?: string;
  onNavigate?: () => void;
  /** Lozenge marker at the start of the underline (see .nav-link). */
  marker?: boolean;
};

export function NavLinks({ items, className, linkClassName, onNavigate, marker }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={item.href === pathname ? "page" : undefined}
            onClick={onNavigate}
            data-marker={marker ? "" : undefined}
            className={linkClassName}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
