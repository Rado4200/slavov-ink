/**
 * Language-neutral studio data. Translatable copy lives in src/messages/.
 *
 * Contact channels are `null` until the artist provides them; null means the
 * link is not rendered at all (never a dead or placeholder link).
 */
export type SiteContent = {
  name: string;
  /** Full profile URL, e.g. "https://www.instagram.com/<handle>". */
  instagram: string | null;
  /** Full page URL, e.g. "https://www.facebook.com/<page>". */
  facebook: string | null;
  /** WhatsApp Business number in international format, digits only, e.g. "359888123456". */
  whatsapp: string | null;
};

export const site: SiteContent = {
  name: "Slavov Ink",
  instagram: null,
  facebook: null,
  whatsapp: null,
};
