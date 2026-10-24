import type { ReactNode } from "react";

import { ContactForm } from "@/components/contact/ContactForm";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { getMessages } from "@/i18n/messages";
import { socialLinks } from "@/lib/social";

import "./contact.css";

/**
 * Home page contact: heading, one-line intro and one glass panel with the
 * form. Configured channels (WhatsApp, Instagram, Facebook) appear as glass
 * secondary buttons under the panel; unconfigured ones are not rendered.
 */
export async function ContactSection({ backdrop }: { backdrop?: ReactNode }) {
  const m = await getMessages();
  const socials = socialLinks(m.contact.whatsappMessage);

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative isolate scroll-mt-24 pt-section"
    >
      {backdrop}
      <Container>
        <div className="mx-auto max-w-2xl">
          <Reveal className="text-center">
            <h2 id="contact-heading" className="text-bone">
              {m.contact.heading}
            </h2>
            <p className="mt-4 text-silver">{m.contact.intro}</p>
          </Reveal>

          <div className="glass mt-10 p-6 sm:p-10">
            <div aria-hidden="true" className="glass-grain" />
            <ContactForm t={m.contact} />
          </div>

          {socials.length > 0 ? (
            <div className="mt-8 text-center">
              <p className="label-ui text-ash">{m.contact.alternatives}</p>
              <ul className="mt-4 flex flex-wrap justify-center gap-3">
                {socials.map((link) => (
                  <li key={link.kind}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button label-ui"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
