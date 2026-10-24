"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { usePathname } from "next/navigation";

import { DiamondDivider } from "@/components/brand/DiamondDivider";
import { NavLinks } from "@/components/layout/NavLinks";
import type { NavLinkItem } from "@/components/layout/NavLinks";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type MobileMenuProps = {
  items: NavLinkItem[];
  labels: { dialog: string; nav: string; open: string; close: string };
  /** Rendered at the bottom of the dialog (the language switcher). */
  footer?: ReactNode;
};

/**
 * Mobile navigation in a native modal <dialog>: the rest of the page becomes
 * inert, ESC closes it, and focus returns to the trigger on close. Tab is
 * additionally wrapped so focus never leaves the dialog.
 */
export function MobileMenu({ items, labels, footer }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const dialogId = useId();
  const pathname = usePathname();

  const show = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };

  const close = () => dialogRef.current?.close();

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const trapFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        className="-mr-2 inline-flex size-11 items-center justify-center text-bone md:hidden"
      >
        <span className="sr-only">{labels.open}</span>
        <span aria-hidden="true" className="flex w-6 flex-col gap-1.5">
          <span className="h-px w-full bg-current" />
          <span className="h-px w-2/3 self-end bg-current" />
          <span className="h-px w-full bg-current" />
        </span>
      </button>

      <dialog
        ref={dialogRef}
        id={dialogId}
        aria-label={labels.dialog}
        onClose={() => setOpen(false)}
        onKeyDown={trapFocus}
        data-lenis-prevent
        className="ease-out-quart fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-ink bg-veil text-bone opacity-0 transition-[opacity,display,overlay] transition-discrete duration-base backdrop:bg-ink open:opacity-100 md:hidden starting:open:opacity-0"
      >
        <div className="flex h-full flex-col px-gutter pb-8">
          <div className="flex h-header items-center justify-end">
            <button
              type="button"
              onClick={close}
              className="-mr-2 inline-flex size-11 items-center justify-center text-bone"
            >
              <span className="sr-only">{labels.close}</span>
              <span aria-hidden="true" className="relative block size-6">
                <span className="absolute top-1/2 left-0 h-px w-full rotate-45 bg-current" />
                <span className="absolute top-1/2 left-0 h-px w-full -rotate-45 bg-current" />
              </span>
            </button>
          </div>

          <nav aria-label={labels.nav} className="flex flex-1 flex-col justify-center">
            <NavLinks
              items={items}
              onNavigate={close}
              className="flex flex-col gap-6"
              linkClassName="label-ui inline-flex min-h-11 items-center text-sm text-silver transition-colors duration-fast ease-main hover:text-bone aria-[current=page]:text-bone"
            />
          </nav>

          <DiamondDivider variant="triple" />
          {footer ? <div className="mt-4 flex justify-center">{footer}</div> : null}
        </div>
      </dialog>
    </>
  );
}
