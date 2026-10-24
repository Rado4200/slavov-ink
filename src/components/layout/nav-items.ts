import type { NavLinkItem } from "@/components/layout/NavLinks";
import { mainNav } from "@/content/navigation";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { localizedPath } from "@/i18n/paths";

/** Localized main navigation, shared by header, mobile menu and footer. */
export function navItems(locale: Locale, m: Messages): NavLinkItem[] {
  return mainNav.map((entry) => ({
    href: localizedPath(locale, entry.href),
    label: m.nav[entry.key],
  }));
}
