import { emailJsProvider } from "@/lib/contact/emailjs";
import type { ContactMessage, ContactProvider, ContactResult } from "@/lib/contact/types";

export type { ContactMessage, ContactResult } from "@/lib/contact/types";

/** The active provider. Swap the implementation here; the form never changes. */
const provider: ContactProvider = emailJsProvider;

/** Sends a contact message. Never reports success unless the provider confirmed it. */
export function sendContactMessage(message: ContactMessage): Promise<ContactResult> {
  return provider.send(message);
}
