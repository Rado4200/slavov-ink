import { notFound } from "next/navigation";

/** Unmatched paths under a locale render the localized [locale]/not-found. */
export default function UnmatchedPage() {
  notFound();
}
