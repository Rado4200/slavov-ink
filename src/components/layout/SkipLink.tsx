type SkipLinkProps = {
  targetId: string;
  label: string;
};

export function SkipLink({ targetId, label }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="fixed top-3 left-3 z-(--z-skip) -translate-y-[200%] bg-bone px-4 py-3 text-sm font-semibold text-ink transition-transform duration-fast focus-visible:translate-y-0"
    >
      {label}
    </a>
  );
}
