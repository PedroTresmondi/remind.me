"use client";

import Link from "next/link";
import {
  isScheduledAfterToday,
  isScheduledBeforeToday,
  isScheduledToday,
} from "@/lib/agenda-bounds";

export type ListKey = "hoje" | "programado" | "todos" | "atrasados" | "inbox" | "sem_data" | "concluidos";

export type AgendaEventRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at?: string;
};

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
  out.concluidos = done;
  out.todos = pending;
  out.hoje = withDate.filter((t) => isScheduledToday(t.due_at!));
  out.atrasados = withDate.filter((t) => isScheduledBeforeToday(t.due_at!));
  out.programado = withDate.filter((t) => isScheduledAfterToday(t.due_at!));
  out.inbox = pending.filter((t) => !t.project_id);
  out.sem_data = pending.filter((t) => !t.due_at);
  return out;
}

export function getProgramadoEvents(events: AgendaEventRow[]): AgendaEventRow[] {
  return events.filter((e) => isScheduledAfterToday(e.starts_at));
}

export type ProgramadoPreviewItem =
  | { kind: "task"; id: string; title: string }
  | { kind: "event"; id: string; title: string };

/** Tarefas + eventos com data futura, ordenados por data. */
export function getProgramadoPreview(
  tasks: TaskRow[],
  events: AgendaEventRow[],
  limit = 2
): ProgramadoPreviewItem[] {
  const byList = getTasksByList(tasks);
  const futureEvents = getProgramadoEvents(events);
  const merged: { at: string; item: ProgramadoPreviewItem }[] = [
    ...byList.programado.map((t) => ({
      at: t.due_at!,
      item: { kind: "task" as const, id: t.id, title: t.title },
    })),
    ...futureEvents.map((e) => ({
      at: e.starts_at,
      item: { kind: "event" as const, id: e.id, title: e.title },
    })),
  ];
  merged.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return merged.slice(0, limit).map((m) => m.item);
}

export function getProgramadoCount(tasks: TaskRow[], events: AgendaEventRow[]): number {
  const byList = getTasksByList(tasks);
  return byList.programado.length + getProgramadoEvents(events).length;
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
