"use client";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`py-12 px-6 text-center ${className}`}
      role="status"
      aria-label={`${title}. ${description ?? ""}`}
    >
      <div className="max-w-sm mx-auto space-y-2">
        <p className="text-[var(--foreground)] font-medium">{title}</p>
        {description && <p className="text-sm text-[var(--muted)]">{description}</p>}
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}
