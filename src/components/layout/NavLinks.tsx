"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLinkItem = {
  /** Localized href ("/bg/about") or in-page anchor ("#contact"). */
  href: string;
  label: string;
};

type NavLinksProps = {
  items: NavLinkItem[];
  className?: string;
  linkClassName?: string;
  onNavigate?: () => void;
};

export function NavLinks({ items, className, linkClassName, onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={item.href === pathname ? "page" : undefined}
            onClick={onNavigate}
            className={linkClassName}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
