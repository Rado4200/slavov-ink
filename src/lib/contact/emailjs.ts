import type { ContactMessage, ContactProvider, ContactResult } from "@/lib/contact/types";

/**
 * EmailJS via its REST endpoint (no SDK dependency). Public browser keys by
 * design; configured with NEXT_PUBLIC_EMAILJS_* (see .env.example). The
 * template receives: from_name, reply_to, message.
 */
const ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

const config = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? "",
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "",
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? "",
};

const configured = Boolean(config.serviceId && config.templateId && config.publicKey);

export const emailJsProvider: ContactProvider = {
  configured,

  async send(message: ContactMessage): Promise<ContactResult> {
    if (!configured) return { ok: false, error: "not-configured" };
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: config.serviceId,
          template_id: config.templateId,
          user_id: config.publicKey,
          template_params: {
            from_name: message.name,
            reply_to: message.email,
            message: message.message,
          },
        }),
      });
      return response.ok ? { ok: true } : { ok: false, error: "failed" };
    } catch {
      return { ok: false, error: "failed" };
    }
  },
};
