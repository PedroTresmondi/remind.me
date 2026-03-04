"use client";

import type { ListKey } from "@/components/dashboard/DashboardLists";
import { getTasksByList } from "@/components/dashboard/DashboardLists";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  priority: string;
  project_id: string | null;
  project: { id: string; name: string; color: string } | null;
};

const LIST_CONFIG: Record<ListKey, { label: string; emptyHint: string }> = {
  hoje: { label: "Hoje", emptyHint: "Sem tarefas hoje. Adicione uma entrega ou lembrete acima." },
  programado: { label: "Programado", emptyHint: "Nenhuma tarefa com data futura. Use o campo acima para agendar." },
  todos: { label: "Todos", emptyHint: "Nenhuma pendência. Capture algo no Quick Add." },
  atrasados: { label: "Atrasados", emptyHint: "Tudo em dia. Boa." },
  inbox: { label: "Inbox", emptyHint: "Caixa vazia. Capture ideias no campo acima." },
  sem_data: { label: "Sem data", emptyHint: "Todas as tarefas têm data definida." },
  concluidos: { label: "Concluídos", emptyHint: "Nada concluído ainda." },
};

export function HubSmartCards({
  tasks,
  activeList,
  onSelectList,
  onOpenProjects,
}: {
  tasks: TaskRow[];
  activeList: ListKey | null;
  onSelectList: (key: ListKey) => void;
  onOpenProjects: () => void;
}) {
  const byList = getTasksByList(tasks);

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {(Object.keys(LIST_CONFIG) as ListKey[]).map((key) => {
        const items = byList[key] ?? [];
        const { label, emptyHint } = LIST_CONFIG[key];
        const count = items.length;
        const preview = items.slice(0, 2);
        const isActive = activeList === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectList(key)}
            className={`ds-card rounded-[var(--radius)] p-4 text-left transition-all duration-[var(--transition-normal)] ${
              isActive ? "ds-card-selected" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {label}
              </h3>
              <span className={`text-xs font-medium tabular-nums rounded-full px-2 py-0.5 ${
                isActive ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "bg-[var(--card-border)]/50 text-[var(--muted)]"
              }`}>
                {count}
              </span>
            </div>
            <ul className="space-y-1 min-h-[2.5rem]">
              {preview.map((t) => (
                <li key={t.id} className="text-xs text-[var(--muted)] truncate">
                  {t.title}
                </li>
              ))}
              {preview.length === 0 && (
                <li className="text-xs text-[var(--muted)]/80 italic">
                  {emptyHint}
                </li>
              )}
            </ul>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onOpenProjects}
        className="rounded-[var(--radius)] p-4 border-2 border-dashed border-[var(--card-border)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 transition-all duration-200 flex items-center justify-center text-sm text-[var(--muted)] min-h-[88px]"
      >
        Projetos
      </button>
    </div>
  );
}
