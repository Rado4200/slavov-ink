/**
 * Studio facts and contact details.
 * Every value starting with "TODO:" is a placeholder awaiting real info from
 * the artist. Components use `isPlaceholder` to avoid rendering them as links.
 */

export type SocialLink = {
  label: string;
  href: string;
};

export type SiteContent = {
  name: string;
  tagline: string;
  description: string;
  city: string;
  email: string;
  instagram: SocialLink;
  socials: SocialLink[];
  booking: {
    status: string;
    instructions: string;
  };
};

const instagram: SocialLink = {
  label: "Instagram",
  href: "TODO: https://www.instagram.com/<handle>",
};

export const site: SiteContent = {
  name: "Slavov Ink",
  tagline: "TODO: short tagline (one line, e.g. style + city)",
  description: "TODO: one-sentence studio description for search results",
  city: "TODO: city",
  email: "TODO: booking email address",
  instagram,
  socials: [
    instagram,
    { label: "TikTok", href: "TODO: https://www.tiktok.com/@<handle> (or remove)" },
    { label: "Facebook", href: "TODO: https://www.facebook.com/<page> (or remove)" },
  ],
  booking: {
    status: "TODO: booking status (open / closed / waitlist)",
    instructions: "TODO: how to book (DM, email, deposit policy)",
  },
};

export function isPlaceholder(value: string): boolean {
  return value.startsWith("TODO:");
}
