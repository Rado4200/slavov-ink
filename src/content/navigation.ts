export type NavItem = {
  label: string;
  href: string;
};

/** "Contact" points at the footer contact block, present on every page. */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Contact", href: "#contact" },
];
