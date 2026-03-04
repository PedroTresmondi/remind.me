"use client";

/**
 * Linha reutilizável para tarefa/evento: alvo de toque >= 44px, hover/focus consistentes.
 */
export interface ListItemRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Conteúdo principal (título + subtítulo) */
  children: React.ReactNode;
  /** Conteúdo à esquerda (ex: checkbox) */
  left?: React.ReactNode;
  /** Conteúdo à direita (ações ou meta) */
  right?: React.ReactNode;
  /** Linha desabilitada (opacity + pointer-events) */
  disabled?: boolean;
  /** Estado selecionado (background) */
  selected?: boolean;
}

export function ListItemRow({
  children,
  left,
  right,
  disabled = false,
  selected = false,
  className = "",
  ...props
}: ListItemRowProps) {
  return (
    <div
      className={[
        "flex items-center gap-3 min-h-[var(--touch-min)] py-3 px-3 -mx-1 rounded-[var(--radius-sm)] border-b border-[var(--card-border)] last:border-0 transition-colors duration-[var(--transition-fast)]",
        !disabled && "hover:bg-[var(--card-hover)]",
        selected && "bg-[var(--accent-muted)]",
        disabled && "opacity-60 pointer-events-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {left && <div className="flex-shrink-0">{left}</div>}
      <div className="flex-1 min-w-0">{children}</div>
      {right && <div className="flex-shrink-0 flex items-center gap-0.5">{right}</div>}
    </div>
  );
}
