"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import type { AgendaEventRow, ListKey } from "@/components/dashboard/DashboardLists";
import { getProgramadoEvents } from "@/components/dashboard/DashboardLists";
import { InboxTriageView } from "@/components/tasks/InboxTriageView";
import {
  isScheduledAfterToday,
  isScheduledBeforeToday,
  isScheduledToday,
} from "@/lib/agenda-bounds";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  pinned_at?: string | null;
  priority: string;
  project_id: string | null;
  project: { id: string; name: string; color: string } | null;
};

const LIST_LABELS: Record<ListKey, string> = {
  hoje: "Hoje",
  programado: "Programado",
  todos: "Todos",
  atrasados: "Atrasados",
  inbox: "Inbox",
  sem_data: "Sem data",
  concluidos: "Concluídos",
};

const EMPTY_STATES: Record<ListKey, { title: string; description: string }> = {
  hoje: { title: "Nada para hoje", description: "Adicione uma tarefa com data de hoje no campo acima ou escolha outra vista." },
  programado: {
    title: "Nada programado",
    description: "Tarefas e eventos com data futura aparecem aqui. Use o Quick Add acima.",
  },
  todos: { title: "Nenhuma pendência", description: "Todas as tarefas estão concluídas ou não há tarefas ainda." },
  atrasados: { title: "Nada em atraso", description: "Ótimo! Não há tarefas vencidas no momento." },
  inbox: { title: "Inbox vazio", description: "Tarefas sem projeto aparecem aqui. Adicione algo pelo Quick Add." },
  sem_data: { title: "Todas com data", description: "Todas as pendências têm data. Ou defina uma tarefa sem prazo." },
  concluidos: { title: "Nenhuma concluída ainda", description: "As tarefas que você marcar como feitas aparecerão aqui." },
};

function filterTasks(tasks: TaskRow[], list: ListKey): TaskRow[] {
  if (list === "todos") return tasks.filter((t) => t.status === "pending");
  if (list === "concluidos") return tasks.filter((t) => t.status === "done");
  if (list === "inbox") return tasks.filter((t) => t.status === "pending" && !t.project_id);
  if (list === "sem_data") return tasks.filter((t) => t.status === "pending" && !t.due_at);
  if (list === "atrasados")
    return tasks.filter((t) => t.status === "pending" && t.due_at && isScheduledBeforeToday(t.due_at));
  if (list === "hoje")
    return tasks.filter((t) => t.status === "pending" && t.due_at && isScheduledToday(t.due_at));
  if (list === "programado")
    return tasks.filter(
      (t) => t.status === "pending" && t.due_at && isScheduledAfterToday(t.due_at)
    );
  return tasks;
}

function groupProgramado(tasks: TaskRow[]): { label: string; tasks: TaskRow[] }[] {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endToday = new Date(start);
  endToday.setHours(23, 59, 59, 999);
  const tomorrow = new Date(start);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endTomorrow = new Date(tomorrow);
  endTomorrow.setHours(23, 59, 59, 999);
  const startWeek = new Date(start);
  startWeek.setDate(start.getDate() - start.getDay());
  const endWeek = new Date(startWeek);
  endWeek.setDate(endWeek.getDate() + 6);
  endWeek.setHours(23, 59, 59, 999);
  const endNextWeek = new Date(endWeek);
  endNextWeek.setDate(endNextWeek.getDate() + 7);
  const groups: { label: string; tasks: TaskRow[] }[] = [
    { label: "Hoje", tasks: [] },
    { label: "Amanhã", tasks: [] },
    { label: "Esta semana", tasks: [] },
    { label: "Próxima semana", tasks: [] },
    { label: "Futuro", tasks: [] },
  ];
  for (const t of tasks) {
    const d = new Date(t.due_at!);
    if (d >= start && d <= endToday) groups[0].tasks.push(t);
    else if (d >= tomorrow && d <= endTomorrow) groups[1].tasks.push(t);
    else if (d <= endWeek) groups[2].tasks.push(t);
    else if (d <= endNextWeek) groups[3].tasks.push(t);
    else groups[4].tasks.push(t);
  }
  return groups.filter((g) => g.tasks.length > 0);
}

const LONG_PRESS_MS = 500;
const SWIPE_THRESHOLD = 60;

export function TaskListWithActions({
  tasks,
  events = [],
  list,
  onTaskClick,
  onPinToggle,
  hideTitle,
}: {
  tasks: TaskRow[];
  events?: AgendaEventRow[];
  list: ListKey | null;
  onTaskClick?: (taskId: string) => void;
  onPinToggle?: (taskId: string, pinned: boolean) => void;
  hideTitle?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [triageMode, setTriageMode] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number>(0);
  const touchSwipeId = useRef<string | null>(null);
  const swipeDeltaRef = useRef<number>(0);
  const [swipeDelta, setSwipeDelta] = useState<number>(0);

  const filtered = list ? filterTasks(tasks, list) : tasks.filter((t) => t.status === "pending");
  const sorted = [...filtered].sort((a, b) => {
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });
  const groupedProgramado = list === "programado" ? groupProgramado(sorted) : null;
  const programadoEvents = list === "programado" ? getProgramadoEvents(events) : [];
  const hasProgramadoContent =
    list === "programado" && (sorted.length > 0 || programadoEvents.length > 0);

  const supabase = createClient();

  const handleComplete = useCallback(
    async (t: TaskRow) => {
      await supabase.from("tasks").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", t.id);
      router.refresh();
      toast.show({
        message: "Item concluído.",
        undoLabel: "Desfazer",
        onUndo: async () => {
          await supabase.from("tasks").update({ status: "pending", completed_at: null }).eq("id", t.id);
          router.refresh();
        },
      });
    },
    [router, toast, supabase]
  );

  const handlePostpone1h = useCallback(
    async (id: string, due: string) => {
      const next = new Date(due);
      next.setTime(next.getTime() + 60 * 60 * 1000);
      await supabase.from("tasks").update({ due_at: next.toISOString() }).eq("id", id);
      router.refresh();
    },
    [router, supabase]
  );

  const handleMoveToTomorrow = useCallback(
    async (id: string, due: string) => {
      const d = new Date(due);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(d.getHours(), d.getMinutes(), 0, 0);
      await supabase.from("tasks").update({ due_at: tomorrow.toISOString() }).eq("id", id);
      router.refresh();
    },
    [router, supabase]
  );

  const handleRemove = useCallback(
    async (t: TaskRow) => {
      const snapshot = { title: t.title, due_at: t.due_at, project_id: t.project_id, priority: t.priority || "medium" };
      await supabase.from("tasks").delete().eq("id", t.id);
      router.refresh();
      toast.show({
        message: "Item excluído.",
        undoLabel: "Desfazer",
        onUndo: async () => {
          await supabase.from("tasks").insert({
            title: snapshot.title,
            due_at: snapshot.due_at,
            project_id: snapshot.project_id,
            priority: snapshot.priority,
            status: "pending",
          });
          router.refresh();
        },
      });
    },
    [router, toast, supabase]
  );

  const startLongPress = useCallback((taskId: string) => {
    longPressTimer.current = setTimeout(() => {
      setExpandedId((id) => (id === taskId ? id : taskId));
      longPressTimer.current = null;
    }, LONG_PRESS_MS);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, taskId: string) => {
    touchStartX.current = e.touches[0].clientX;
    touchSwipeId.current = taskId;
    swipeDeltaRef.current = 0;
    setSwipeDelta(0);
    startLongPress(taskId);
  }, [startLongPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent, taskId: string) => {
    if (touchSwipeId.current !== taskId) return;
    const x = e.touches[0].clientX;
    const delta = x - touchStartX.current;
    if (Math.abs(delta) > 20) cancelLongPress();
    swipeDeltaRef.current = delta;
    setSwipeDelta(delta);
  }, [cancelLongPress]);

  const handleTouchEnd = useCallback((t: TaskRow) => {
    const delta = swipeDeltaRef.current;
    touchSwipeId.current = null;
    setSwipeDelta(0);
    if (delta >= SWIPE_THRESHOLD && t.status === "pending") {
      handleComplete(t);
    } else if (delta <= -SWIPE_THRESHOLD && t.due_at) {
      handlePostpone1h(t.id, t.due_at);
    }
  }, [handleComplete, handlePostpone1h]);

  const renderRow = (t: TaskRow) => {
    const showActions = expandedId === t.id;

    const content = (
      <>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleComplete(t); }}
          className={`w-5 h-5 rounded-full flex-shrink-0 transition-colors ${
            t.status === "done" ? "bg-[var(--accent)]" : "border-2 border-[var(--muted)] hover:border-[var(--accent)]"
          }`}
          aria-label="Concluir"
        />
        {onTaskClick ? (
          <button
            type="button"
            onClick={() => onTaskClick(t.id)}
            className="flex-1 min-w-0 text-left"
          >
            <span className={t.status === "done" ? "line-through text-[var(--muted)]" : "text-[var(--foreground)]"}>
              {t.title}
            </span>
            <span className="block text-xs text-[var(--muted)] truncate mt-0.5">
              {t.due_at &&
                new Date(t.due_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  ...(new Date(t.due_at).getHours() || new Date(t.due_at).getMinutes() ? { hour: "2-digit", minute: "2-digit" } : {}),
                })}
              {t.project?.name && ` · ${t.project.name}`}
            </span>
          </button>
        ) : (
          <Link href={`/dashboard/tasks/${t.id}`} className="flex-1 min-w-0">
            <span className={t.status === "done" ? "line-through text-[var(--muted)]" : "text-[var(--foreground)]"}>
              {t.title}
            </span>
            <span className="block text-xs text-[var(--muted)] truncate mt-0.5">
              {t.due_at &&
                new Date(t.due_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  ...(new Date(t.due_at).getHours() || new Date(t.due_at).getMinutes() ? { hour: "2-digit", minute: "2-digit" } : {}),
                })}
              {t.project?.name && ` · ${t.project.name}`}
            </span>
          </Link>
        )}
        {/* Ações discretas: visíveis no hover (desktop) ou quando expandedId === t.id (mobile long-press) */}
        <div
          className={`flex items-center gap-0.5 transition-opacity duration-200 ${
            showActions ? "opacity-100" : "opacity-0 group-hover/item:opacity-100"
          }`}
        >
          {onPinToggle && t.status === "pending" && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPinToggle(t.id, !t.pinned_at); }}
              className={`p-1.5 rounded-[var(--radius-sm)] transition-colors ${
                t.pinned_at ? "text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--muted)]/20"
              }`}
              title={t.pinned_at ? "Desfixar das prioridades" : "Fixar nas prioridades do dia"}
              aria-label={t.pinned_at ? "Desfixar" : "Fixar"}
            >
              <svg className="w-4 h-4" fill={t.pinned_at ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          {t.status === "pending" && t.due_at && (
            <>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePostpone1h(t.id, t.due_at!); }}
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--muted)] hover:bg-[var(--muted)]/20 transition-colors"
                title="Adiar 1h"
                aria-label="Adiar 1h"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMoveToTomorrow(t.id, t.due_at!); }}
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--muted)] hover:bg-[var(--muted)]/20 transition-colors"
                title="Mover para amanhã"
                aria-label="Mover para amanhã"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onTaskClick) onTaskClick(t.id);
              else router.push(`/dashboard/tasks/${t.id}`);
            }}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--muted)] hover:bg-[var(--muted)]/20 transition-colors"
            title="Editar"
            aria-label="Editar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(t); }}
            className="p-1.5 rounded-[var(--radius-sm)] text-red-500 hover:bg-red-500/10 transition-colors"
            title="Excluir"
            aria-label="Excluir"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </>
    );

    return (
      <li
        key={t.id}
        className="group group/item"
        onTouchStart={(e) => handleTouchStart(e, t.id)}
        onTouchEnd={() => handleTouchEnd(t)}
        onTouchMove={(e) => handleTouchMove(e, t.id)}
        onTouchCancel={() => {
          touchSwipeId.current = null;
          setSwipeDelta(0);
          cancelLongPress();
        }}
      >
        <div className="flex items-center gap-3 py-3 px-3 -mx-1 rounded-[var(--radius-sm)] hover:bg-[var(--muted)]/10 border-b border-[var(--card-border)] last:border-0 transition-colors duration-150">
          {content}
        </div>
      </li>
    );
  };

  return (
    <>
      {list && !hideTitle && (
        <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight mb-4">
          {LIST_LABELS[list]}
        </h1>
      )}
      {list === "inbox" && filtered.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setTriageMode((v) => !v)}
            className={`text-sm font-medium px-3 py-1.5 rounded-[var(--radius-sm)] border transition-colors ${
              triageMode
                ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]"
                : "border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {triageMode ? "Sair do modo triagem" : "Modo triagem"}
          </button>
        </div>
      )}
      {list === "inbox" && triageMode && filtered.length > 0 ? (
        <InboxTriageView
          tasks={filtered}
          onTaskClick={(id) => onTaskClick?.(id)}
          onDone={() => router.refresh()}
        />
      ) : list === "programado" && hasProgramadoContent ? (
        <div className="space-y-4">
          {programadoEvents.length > 0 && (
            <div className="rounded-[var(--radius)] border border-[var(--card-border)] overflow-hidden bg-[var(--card)]">
              <h2 className="py-2 px-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--card-border)]">
                Eventos
              </h2>
              <ul className="divide-y divide-[var(--card-border)]">
                {programadoEvents.map((e) => {
                  const dateKey = e.starts_at.slice(0, 10);
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/dashboard/calendar?date=${dateKey}`}
                        className="flex items-center gap-3 py-3 px-4 hover:bg-[var(--muted)]/10 transition-colors"
                      >
                        <span className="w-2 h-2 rounded-full shrink-0 bg-blue-500" title="Evento" />
                        <span className="text-sm text-[var(--foreground)] truncate flex-1">{e.title}</span>
                        <span className="text-xs text-[var(--muted)] shrink-0">
                          {new Date(e.starts_at).toLocaleString("pt-BR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {groupedProgramado && groupedProgramado.length > 0 && (
            <div className="space-y-0 rounded-[var(--radius)] border border-[var(--card-border)] overflow-hidden bg-[var(--card)]">
              {groupedProgramado.map((g, idx) => (
                <div key={g.label}>
                  <h2
                    className={`py-2 px-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--card-border)] ${idx === 0 && programadoEvents.length === 0 ? "rounded-t-[var(--radius)]" : ""}`}
                  >
                    {g.label} — tarefas
                  </h2>
                  <ul className="divide-y divide-[var(--card-border)]">
                    {g.tasks.map(renderRow)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <ul className="card rounded-[var(--radius)] overflow-hidden divide-y divide-[var(--card-border)]">
          {sorted.map(renderRow)}
          {sorted.length === 0 && list && (
            <li className="py-12 px-6 text-center">
              <div className="max-w-sm mx-auto space-y-2">
                <p className="text-[var(--foreground)] font-medium">{EMPTY_STATES[list].title}</p>
                <p className="text-sm text-[var(--muted)]">{EMPTY_STATES[list].description}</p>
              </div>
            </li>
          )}
          {sorted.length === 0 && !list && (
            <li className="py-12 text-center text-sm text-[var(--muted)]">Nenhum item nesta lista.</li>
          )}
        </ul>
      )}
    </>
  );
}
