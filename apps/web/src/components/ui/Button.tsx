"use client";

import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] focus-visible:ring-[var(--accent)]",
  secondary:
    "bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--card-hover)] hover:border-[var(--muted)] focus-visible:ring-[var(--muted)]",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[var(--card-hover)] focus-visible:ring-[var(--muted)]",
  danger:
    "bg-[var(--danger-muted)] text-[var(--danger)] hover:bg-[var(--danger)]/20 focus-visible:ring-[var(--danger)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "min-h-[var(--button-height-sm)] px-3 text-xs",
  md: "min-h-[var(--button-height)] px-4 text-sm",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        className={[
          "ds-btn-base focus-ring rounded-[var(--radius-sm)] font-medium",
          variantClasses[variant],
          sizeClasses[size],
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading ? (
          <span className="ds-skeleton w-4 h-4 rounded-full shrink-0" aria-hidden />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";
