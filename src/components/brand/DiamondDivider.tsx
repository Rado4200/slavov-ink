/** Decorative divider built from the logo's lozenge (diamond) accent. */
type DiamondDividerProps = {
  variant?: "single" | "triple";
  className?: string;
};

function Diamond({ small = false }: { small?: boolean }) {
  return (
    <span
      className={[
        "block shrink-0 rotate-45 bg-bone",
        small ? "size-1" : "size-1.5 shadow-glow",
      ].join(" ")}
    />
  );
}

export function DiamondDivider({ variant = "single", className }: DiamondDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={["flex w-full items-center gap-3", className ?? ""].join(" ")}
    >
      <span className="h-px flex-1 bg-linear-to-r from-transparent to-royal" />
      {variant === "triple" ? (
        <span className="flex items-center gap-2">
          <Diamond small />
          <Diamond />
          <Diamond small />
        </span>
      ) : (
        <Diamond />
      )}
      <span className="h-px flex-1 bg-linear-to-l from-transparent to-royal" />
    </div>
  );
}
