"use client";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  padding?: "none" | "sm" | "md";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
};

export function Card({
  selected = false,
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "ds-card rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--shadow)] transition-all duration-[var(--transition-normal)]",
        padding !== "none" && paddingClasses[padding],
        selected && "ds-card-selected",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
