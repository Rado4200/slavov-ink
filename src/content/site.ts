/**
 * Language-neutral studio data (names, URLs, addresses). Translatable copy
 * lives in src/messages/. Values starting with "TODO:" are placeholders
 * awaiting real info from the artist; components use `isPlaceholder` to avoid
 * rendering them as links.
 */

export type SocialLink = {
  label: string;
  href: string;
};

export type SiteContent = {
  name: string;
  email: string;
  socials: SocialLink[];
};

export const site: SiteContent = {
  name: "Slavov Ink",
  email: "TODO: booking email address",
  socials: [
    { label: "Instagram", href: "TODO: https://www.instagram.com/<handle>" },
    { label: "Facebook", href: "TODO: https://www.facebook.com/<page>" },
  ],
};

export function isPlaceholder(value: string): boolean {
  return value.startsWith("TODO:");
}
