"use client";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "info";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[var(--card-border)]/30 text-[var(--foreground)]",
  accent: "bg-[var(--accent-muted)] text-[var(--accent)]",
  success: "bg-[var(--success-muted)] text-[var(--success)]",
  warning: "bg-[var(--warning-muted)] text-[var(--warning)]",
  danger: "bg-[var(--danger-muted)] text-[var(--danger)]",
  info: "bg-[var(--info-muted)] text-[var(--info)]",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  onRemove?: () => void;
}

export function Badge({
  variant = "default",
  onRemove,
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-[var(--radius-xs)] px-2 py-0.5 text-xs font-medium transition-colors",
        variantClasses[variant],
        onRemove && "pr-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-0.5 rounded-full hover:bg-black/10 min-w-[22px] min-h-[22px] flex items-center justify-center -m-0.5"
          aria-label="Remover"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
