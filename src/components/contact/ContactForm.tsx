"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";

import { DiamondDivider } from "@/components/brand/DiamondDivider";
import { sendContactMessage } from "@/lib/contact";
import type { Messages } from "@/messages/en";

type Field = "name" | "email" | "message";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

const MIN_FILL_MS = 3000;
const RATE_LIMIT_MS = 60_000;
const SENT_KEY = "slavov-ink:contact-sent-at";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FIELDS: Field[] = ["name", "email", "message"];

function lastSentAt(): number {
  try {
    return Number(window.localStorage.getItem(SENT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function rememberSent() {
  try {
    window.localStorage.setItem(SENT_KEY, String(Date.now()));
  } catch {
    // Storage blocked: the 60 s limit simply does not persist.
  }
}

function ErrorIcon() {
  // A lozenge with an exclamation mark: the brand diamond as a warning sign.
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0" fill="none">
      <path d="M8 1.5 14.5 8 8 14.5 1.5 8Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 4.8v4.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.1" r="0.85" fill="currentColor" />
    </svg>
  );
}

export function ContactForm({ t }: { t: Messages["contact"] }) {
  const [values, setValues] = useState<Values>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const startedAt = useRef(0);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  const validate = (v: Values): Errors => {
    const next: Errors = {};
    if (v.name.trim().length < 2) next.name = t.nameRequired;
    if (!EMAIL.test(v.email.trim())) next.email = t.emailInvalid;
    if (v.message.trim().length < 10) next.message = t.messageRequired;
    return next;
  };

  const update = (field: Field) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = { ...values, [field]: event.target.value };
    setValues(next);
    if (attempted) setErrors(validate(next));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;
    setAttempted(true);
    setFormError(null);
    const found = validate(values);
    setErrors(found);
    const firstInvalid = FIELDS.find((field) => found[field]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    // Spam guards. A filled honeypot means a bot: fail quietly, never fake success.
    if (honeypotRef.current?.value) return setFormError(t.sendFailed);
    if (Date.now() - startedAt.current < MIN_FILL_MS) return setFormError(t.tooFast);
    if (Date.now() - lastSentAt() < RATE_LIMIT_MS) return setFormError(t.rateLimited);

    setStatus("sending");
    const result = await sendContactMessage({
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
    });
    if (result.ok) {
      rememberSent();
      setStatus("success");
    } else {
      setStatus("idle");
      setFormError(result.error === "not-configured" ? t.notConnected : t.sendFailed);
    }
  };

  const field = (name: Field, label: string, control: (props: ControlProps) => ReactNode) => {
    const errorId = `${id}-${name}-error`;
    const error = errors[name];
    return (
      <div>
        <label htmlFor={`${id}-${name}`} className="label-ui text-silver">
          {label}
        </label>
        {control({
          id: `${id}-${name}`,
          name,
          value: values[name],
          onChange: update(name),
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error ? errorId : undefined,
          className: `contact-input${error ? " is-invalid" : ""}`,
        })}
        {error ? (
          <p id={errorId} className="mt-2 flex gap-2 text-sm text-bone">
            <ErrorIcon />
            {error}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <>
      {/* Persistent live region: announces the outcome without moving the reader. */}
      <p className="sr-only" aria-live="polite">
        {status === "success" ? t.successHeading : status === "sending" ? t.sending : ""}
      </p>

      {status === "success" ? (
        <div ref={successRef} tabIndex={-1} className="py-6 text-center outline-none">
          <h3 className="text-bone">{t.successHeading}</h3>
          <DiamondDivider variant="triple" className="mx-auto my-6 max-w-xs" />
          <p className="text-silver">{t.successBody}</p>
        </div>
      ) : (
        <form ref={formRef} noValidate onSubmit={onSubmit} className="grid gap-6">
          {field("name", t.nameLabel, (props) => (
            <input type="text" autoComplete="name" {...props} />
          ))}
          {field("email", t.emailLabel, (props) => (
            <input type="email" autoComplete="email" inputMode="email" {...props} />
          ))}
          {field("message", t.messageLabel, (props) => (
            <textarea rows={5} {...props} />
          ))}

          {/* Honeypot: invisible to people and assistive tech, tempting to bots. */}
          <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
            <label htmlFor={`${id}-website`}>{t.honeypotLabel}</label>
            <input
              ref={honeypotRef}
              id={`${id}-website`}
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {formError ? (
            <p role="alert" className="contact-alert flex gap-3 text-sm text-bone">
              <ErrorIcon />
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === "sending"}
            aria-busy={status === "sending"}
            className="contact-submit label-ui"
          >
            {status === "sending" ? t.sending : t.submit}
          </button>
        </form>
      )}
    </>
  );
}

type ControlProps = {
  id: string;
  name: Field;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
  className: string;
};
