"use client";

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "Q ou /", description: "Focar o campo de captura rápida" },
  { keys: "N", description: "Abrir painel para adicionar novo item" },
  { keys: "Esc", description: "Fechar drawer, sheet ou painel aberto" },
  { keys: "Enter", description: "Salvar no Quick Add (quando no campo)" },
  { keys: "Shift + Enter", description: "Abrir mais opções no Quick Add" },
  { keys: "T", description: "No calendário: ir para hoje" },
];

export function ShortcutsHelp({ className }: { className?: string }) {
  return (
    <div className={className}>
      <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Atalhos de teclado
      </h2>
      <ul className="space-y-2">
        {SHORTCUTS.map(({ keys, description }) => (
          <li
            key={keys}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="text-[var(--muted)]">{description}</span>
            <kbd className="shrink-0 px-2 py-1 rounded-[var(--radius-xs)] bg-[var(--muted)]/20 text-[var(--foreground)] font-mono text-xs">
              {keys}
            </kbd>
          </li>
        ))}
      </ul>
    </div>
  );
}
