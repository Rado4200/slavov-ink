import { site } from "@/content/site";

export type SocialLink = {
  kind: "whatsapp" | "instagram" | "facebook";
  label: string;
  href: string;
};

/**
 * Configured contact channels only (unset channels are omitted, never shown
 * as dead links). Labels are brand names, identical in every language.
 */
export function socialLinks(whatsappMessage: string): SocialLink[] {
  const links: SocialLink[] = [];
  if (site.whatsapp) {
    links.push({
      kind: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`,
    });
  }
  if (site.instagram) links.push({ kind: "instagram", label: "Instagram", href: site.instagram });
  if (site.facebook) links.push({ kind: "facebook", label: "Facebook", href: site.facebook });
  return links;
}
