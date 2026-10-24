/** Provider-agnostic contact message contract (swap providers without touching UI). */
export type ContactMessage = {
  name: string;
  email: string;
  message: string;
};

export type ContactResult =
  | { ok: true }
  | {
      ok: false;
      /** not-configured: provider env missing; failed: network or provider rejection. */
      error: "not-configured" | "failed";
    };

export type ContactProvider = {
  readonly configured: boolean;
  send(message: ContactMessage): Promise<ContactResult>;
};
