"use client";

export interface SectionHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 mb-3 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wide">
          {title}
          {subtitle != null && (
            <span className="text-[var(--foreground)] font-semibold normal-case ml-1">
              {subtitle}
            </span>
          )}
        </h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
