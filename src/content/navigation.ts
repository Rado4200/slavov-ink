import type { Messages } from "@/messages/en";

/** Main navigation structure. Labels come from the `nav` message namespace. */
export type NavKey = keyof Messages["nav"];

export type NavEntry = {
  key: NavKey;
  /** Locale-neutral path ("/about"), or an in-page anchor ("#contact"). */
  href: string;
};

/** "Contact" points at the footer contact block, present on every page. */
export const mainNav: NavEntry[] = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "portfolio", href: "/portfolio" },
  { key: "contact", href: "#contact" },
];
