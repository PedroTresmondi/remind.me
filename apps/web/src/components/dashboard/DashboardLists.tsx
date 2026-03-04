"use client";

import Link from "next/link";

export type ListKey = "hoje" | "programado" | "todos" | "atrasados" | "inbox" | "sem_data" | "concluidos";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  priority: string;
  project_id: string | null;
  project: { id: string; name: string; color: string } | null;
};

const LIST_CONFIG: Record<ListKey, { label: string; href: string }> = {
  hoje: { label: "Hoje", href: "/dashboard/tasks?list=hoje" },
  programado: { label: "Programado", href: "/dashboard/tasks?list=programado" },
  todos: { label: "Todos", href: "/dashboard/tasks?list=todos" },
  atrasados: { label: "Atrasados", href: "/dashboard/tasks?list=atrasados" },
  inbox: { label: "Inbox", href: "/dashboard/tasks?list=inbox" },
  sem_data: { label: "Sem data", href: "/dashboard/tasks?list=sem_data" },
  concluidos: { label: "Concluídos", href: "/dashboard/tasks?list=concluidos" },
};

export function getTasksByList(tasks: TaskRow[]): Record<ListKey, TaskRow[]> {
  const out: Record<ListKey, TaskRow[]> = {
    hoje: [],
    programado: [],
    todos: [],
    atrasados: [],
    inbox: [],
    sem_data: [],
    concluidos: [],
  };
  const pending = tasks.filter((t) => t.status === "pending");
  const done = tasks.filter((t) => t.status === "done");
  const withDate = pending.filter((t) => t.due_at);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endToday = new Date(startToday);
  endToday.setHours(23, 59, 59, 999);
  out.concluidos = done;
  out.todos = pending;
  out.hoje = withDate.filter((t) => {
    const d = new Date(t.due_at!);
    return d >= startToday && d <= endToday;
  });
  out.atrasados = withDate.filter((t) => new Date(t.due_at!) < startToday);
  out.programado = withDate.filter((t) => {
    const d = new Date(t.due_at!);
    return d > endToday;
  });
  out.inbox = pending.filter((t) => !t.project_id);
  out.sem_data = pending.filter((t) => !t.due_at);
  return out;
}

export function DashboardLists({ tasks }: { tasks: TaskRow[] }) {
  const byList = getTasksByList(tasks);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {(Object.keys(LIST_CONFIG) as ListKey[]).map((key) => {
        const items = byList[key] ?? [];
        const { label, href } = LIST_CONFIG[key];
        const count = items.length;
        const preview = items.slice(0, 2);
        return (
          <Link
            key={key}
            href={href}
            className="card rounded-[var(--radius)] p-4 hover:shadow-[var(--shadow-md)] transition-shadow block text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {label}
              </h3>
              <span className="text-xs font-medium text-[var(--muted)] tabular-nums bg-[var(--muted)]/20 rounded-full px-2 py-0.5">
                {count}
              </span>
            </div>
            <ul className="space-y-1">
              {preview.map((t) => (
                <li key={t.id} className="text-xs text-[var(--muted)] truncate">
                  {t.title}
                </li>
              ))}
              {preview.length === 0 && (
                <li className="text-xs text-[var(--muted)]">Nenhum item</li>
              )}
            </ul>
          </Link>
        );
      })}
      <Link
        href="/dashboard/projects"
        className="card rounded-[var(--radius)] p-4 border-dashed border-2 border-[var(--card-border)] hover:shadow-[var(--shadow)] hover:border-[var(--accent)]/30 transition-all flex items-center justify-center text-sm text-[var(--muted)] min-h-[88px]"
      >
        Projetos
      </Link>
    </div>
  );
}
