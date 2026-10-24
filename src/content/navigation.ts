import type { Messages } from "@/messages/en";

/** Main navigation structure. Labels come from the `nav` message namespace. */
export type NavKey = keyof Messages["nav"];

export type NavEntry = {
  key: NavKey;
  /** Locale-neutral path, e.g. "/about". */
  href: string;
};

/** Exactly three destinations; contact is the form at the bottom of Home. */
export const mainNav: NavEntry[] = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "portfolio", href: "/portfolio" },
];
