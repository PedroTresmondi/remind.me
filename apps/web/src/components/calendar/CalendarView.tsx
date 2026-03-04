"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { QuickCreatePopover } from "./QuickCreatePopover";
import { QuickAddForm } from "@/components/quick-add/QuickAddForm";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  starts_at: string | null;
  due_at: string | null;
  priority: string;
  project: { id: string; name: string; color: string } | null;
};

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  project: { id: string; name: string; color: string } | null;
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateOnly(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns array of weeks; each week is 7 days (Sun–Sat). Fills leading/trailing with prev/next month. */
function getCalendarWeeks(year: number, month: number): { date: Date; isCurrentMonth: boolean }[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = new Date(first);
  start.setDate(start.getDate() - first.getDay());
  const weeks: { date: Date; isCurrentMonth: boolean }[][] = [];
  let current = new Date(start);
  while (weeks.length < 6) {
    const week: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      week.push({
        date: d,
        isCurrentMonth: d.getMonth() === month,
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current > last && current.getDay() === 0) break;
  }
  return weeks;
}

export function CalendarView() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [createPopoverDate, setCreatePopoverDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const start = new Date(year, month - 1, 1);
  const endNext = new Date(year, month + 2, 0, 23, 59, 59, 999);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [tasksRes, eventsRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, status, starts_at, due_at, priority, project:projects(id, name, color)")
        .gte("due_at", start.toISOString())
        .lte("due_at", endNext.toISOString()),
      supabase
        .from("events")
        .select("id, title, starts_at, ends_at, location, project:projects(id, name, color)")
        .gte("starts_at", start.toISOString())
        .lte("starts_at", endNext.toISOString()),
    ]);
    const rawTasks = (tasksRes.data ?? []) as Array<{
      id: string;
      title: string;
      status: string;
      starts_at: string | null;
      due_at: string | null;
      priority: string;
      project: { id: string; name: string; color: string } | { id: string; name: string; color: string }[] | null;
    }>;
    const rawEvents = (eventsRes.data ?? []) as Array<{
      id: string;
      title: string;
      starts_at: string;
      ends_at: string;
      location: string | null;
      project: { id: string; name: string; color: string } | { id: string; name: string; color: string }[] | null;
    }>;
    setTasks(
      rawTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        starts_at: t.starts_at,
        due_at: t.due_at,
        priority: t.priority,
        project: Array.isArray(t.project) ? t.project[0] ?? null : t.project ?? null,
      }))
    );
    setEvents(
      rawEvents.map((e) => ({
        id: e.id,
        title: e.title,
        starts_at: e.starts_at,
        ends_at: e.ends_at,
        location: e.location,
        project: Array.isArray(e.project) ? e.project[0] ?? null : e.project ?? null,
      }))
    );
    setLoading(false);
  }, [start.toISOString(), endNext.toISOString()]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const weeks = getCalendarWeeks(year, month);
  const today = new Date();

  const tasksByDay: Record<string, TaskRow[]> = {};
  const eventsByDay: Record<string, EventRow[]> = {};
  tasks.forEach((t) => {
    if (!t.due_at) return;
    const key = toDateOnly(t.due_at);
    if (!tasksByDay[key]) tasksByDay[key] = [];
    tasksByDay[key].push(t);
  });
  events.forEach((e) => {
    const key = toDateOnly(e.starts_at);
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(e);
  });

  const selectedKey = selectedDate ? toDateOnly(selectedDate.toISOString()) : null;
  const selectedTasks: TaskRow[] = selectedKey ? (tasksByDay[selectedKey] ?? []) : [];
  const selectedEvents: EventRow[] = selectedKey ? (eventsByDay[selectedKey] ?? []) : [];
  const selectedItems = [
    ...selectedTasks.map((t) => ({ type: "task" as const, data: t })),
    ...selectedEvents.map((e) => ({ type: "event" as const, data: e })),
  ].sort((a, b) => {
    const timeA = a.type === "task" ? ((a.data as TaskRow).starts_at ?? (a.data as TaskRow).due_at) : (a.data as EventRow).starts_at;
    const timeB = b.type === "task" ? ((b.data as TaskRow).starts_at ?? (b.data as TaskRow).due_at) : (b.data as EventRow).starts_at;
    if (!timeA) return 1;
    if (!timeB) return -1;
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });

  const todayKey = toDateOnly(today.toISOString());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toDateOnly(tomorrow.toISOString());
  const agendaDays: { label: string; key: string }[] = [
    { label: "Hoje", key: todayKey },
    { label: "Amanhã", key: tomorrowKey },
  ];
  for (let i = 2; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    agendaDays.push({
      label: d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }),
      key: toDateOnly(d.toISOString()),
    });
  }

  const goPrev = () => setViewDate(new Date(year, month - 1));
  const goNext = () => setViewDate(new Date(year, month + 1));
  const goToday = () => setViewDate(new Date());

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        goToday();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function quickCompleteTask(taskId: string) {
    const supabase = createClient();
    await supabase.from("tasks").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", taskId);
    fetchData();
  }

  async function quickPostponeTask(taskId: string, currentDue: string) {
    const supabase = createClient();
    const next = new Date(currentDue);
    next.setTime(next.getTime() + 60 * 60 * 1000);
    await supabase.from("tasks").update({ due_at: next.toISOString() }).eq("id", taskId);
    fetchData();
  }

  async function quickMoveToTomorrow(taskId: string, currentDue: string) {
    const supabase = createClient();
    const d = new Date(currentDue);
    const tomorrow = new Date(selectedDate!);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(d.getHours(), d.getMinutes(), 0, 0);
    await supabase.from("tasks").update({ due_at: tomorrow.toISOString() }).eq("id", taskId);
    fetchData();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight mb-4">
        Calendário
      </h1>

      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <button
          type="button"
          onClick={goPrev}
          className="p-2 rounded-[var(--radius-sm)] border border-[var(--card-border)] hover:bg-[var(--muted)]/10 text-[var(--foreground)] transition-colors"
          aria-label="Mês anterior"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-lg font-medium text-[var(--foreground)] min-w-[140px] text-center">
          {MONTH_LABELS[month]} {year}
        </span>
        <button
          type="button"
          onClick={goNext}
          className="p-2 rounded-[var(--radius-sm)] border border-[var(--card-border)] hover:bg-[var(--muted)]/10 text-[var(--foreground)] transition-colors"
          aria-label="Próximo mês"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={goToday}
          className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--card-border)] hover:bg-[var(--muted)]/10 text-sm font-medium text-[var(--foreground)] transition-colors"
          title="Ir para hoje (T)"
        >
          Hoje
        </button>
        <div className="flex rounded-[var(--radius-sm)] border border-[var(--card-border)] p-0.5 bg-[var(--card)]">
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 text-sm rounded-[var(--radius-sm)] font-medium transition-colors ${
              viewMode === "month"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Mês
          </button>
          <button
            type="button"
            onClick={() => setViewMode("agenda")}
            className={`px-3 py-1.5 text-sm rounded-[var(--radius-sm)] font-medium transition-colors ${
              viewMode === "agenda"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Agenda
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-[var(--muted)] py-8 text-center">Carregando…</p>
      ) : viewMode === "agenda" ? (
        <div className="space-y-6">
          <QuickAddForm defaultHour={9} defaultMinute={0} placeholder="Adicionar à agenda..." />
          {agendaDays.map(({ label, key }) => {
            const dayTasks = tasksByDay[key] ?? [];
            const dayEvents = eventsByDay[key] ?? [];
            const items = [
              ...dayTasks.map((t) => ({ type: "task" as const, data: t })),
              ...dayEvents.map((e) => ({ type: "event" as const, data: e })),
            ].sort((a, b) => {
              const timeA = a.type === "task" ? ((a.data as TaskRow).starts_at ?? (a.data as TaskRow).due_at) : (a.data as EventRow).starts_at;
              const timeB = b.type === "task" ? ((b.data as TaskRow).starts_at ?? (b.data as TaskRow).due_at) : (b.data as EventRow).starts_at;
              if (!timeA) return 1;
              if (!timeB) return -1;
              return new Date(timeA).getTime() - new Date(timeB).getTime();
            });
            return (
              <div key={key} className="card rounded-[var(--radius)] p-4">
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">{label}</h2>
                {items.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] py-1">Nada agendado.</p>
                ) : (
                  <ul className="space-y-1">
                    {items.map((item) =>
                      item.type === "task" ? (
                        <li key={(item.data as TaskRow).id}>
                          <Link
                            href={`/dashboard/tasks/${(item.data as TaskRow).id}`}
                            className="flex items-center gap-2 py-1.5 text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                          >
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                (item.data as TaskRow).status === "done"
                                  ? "bg-[var(--muted)]"
                                  : "bg-[var(--accent)]"
                              }`}
                            />
                            {(item.data as TaskRow).due_at && (
                              <span className="text-xs text-[var(--muted)] w-10">
                                {(item.data as TaskRow).starts_at
                                  ? `${new Date((item.data as TaskRow).starts_at!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} – ${new Date((item.data as TaskRow).due_at!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                                  : new Date((item.data as TaskRow).due_at!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                            <span className={((item.data as TaskRow).status === "done" ? "line-through text-[var(--muted)]" : "")}>
                              {(item.data as TaskRow).title}
                            </span>
                          </Link>
                        </li>
                      ) : (
                        <li key={(item.data as EventRow).id}>
                          <span className="flex items-center gap-2 py-1.5 text-sm">
                            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-blue-500" />
                            <span className="text-xs text-[var(--muted)] w-10">
                              {new Date((item.data as EventRow).starts_at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="text-[var(--foreground)]">{(item.data as EventRow).title}</span>
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card rounded-[var(--radius)] overflow-hidden">
              <div className="grid grid-cols-7 text-center text-xs font-medium text-[var(--muted)] border-b border-[var(--card-border)]">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="p-1 sm:p-2 truncate">
                    {label}
                  </div>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b border-[var(--card-border)] last:border-b-0">
                  {week.map(({ date, isCurrentMonth }, di) => {
                    const key = toDateOnly(date.toISOString());
                    const dayTasks = tasksByDay[key] ?? [];
                    const dayEvents = eventsByDay[key] ?? [];
                    const hasOverdue = dayTasks.some(
                      (t) => t.status === "pending" && t.due_at && new Date(t.due_at) < startOfDay(today)
                    );
                    const hasDone = dayTasks.some((t) => t.status === "done");
                    const hasPending = dayTasks.some((t) => t.status === "pending");
                    const hasEvent = dayEvents.length > 0;
                    const isToday = isSameDay(date, today);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    return (
                      <button
                        key={di}
                        type="button"
                        onClick={() => setSelectedDate(new Date(date))}
                        className={`
                          min-h-[64px] sm:min-h-[80px] p-1 sm:p-2 text-left flex flex-col border-r border-[var(--card-border)] last:border-r-0
                          hover:bg-[var(--muted)]/10 transition-colors
                          ${!isCurrentMonth ? "bg-[var(--muted)]/5 text-[var(--muted)]" : "bg-[var(--card)]"}
                          ${isToday ? "ring-1 ring-[var(--accent)] ring-inset" : ""}
                          ${isSelected ? "bg-teal-50 dark:bg-teal-950/50 ring-1 ring-[var(--accent)] ring-inset" : ""}
                        `}
                      >
                        <span
                          className={`
                            w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-sm
                            ${isToday ? "bg-[var(--accent)] text-white font-semibold" : ""}
                            ${isSelected && !isToday ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-medium" : ""}
                            ${!isCurrentMonth ? "text-[var(--muted)]" : ""}
                          `}
                        >
                          {date.getDate()}
                        </span>
                        <div className="mt-1 flex flex-wrap gap-0.5 justify-center">
                          {hasOverdue && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Atrasado" />
                          )}
                          {hasPending && !hasOverdue && (
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" title="Tarefa" />
                          )}
                          {hasDone && (
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" title="Concluído" />
                          )}
                          {hasEvent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Evento" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="card rounded-[var(--radius)] p-4 min-h-[200px]">
            {selectedDate ? (
              <>
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  {selectedDate.getDate()} de {MONTH_LABELS[selectedDate.getMonth()]}
                  {selectedDate.getFullYear() !== year && ` de ${selectedDate.getFullYear()}`}
                </h2>
                <button
                  type="button"
                  onClick={() => setCreatePopoverDate(new Date(selectedDate))}
                  className="mb-3 w-full py-2 rounded-[var(--radius-sm)] border-2 border-dashed border-[var(--accent)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)]/10 transition-colors"
                >
                  + Adicionar neste dia
                </button>
                <div className="mb-3">
                  <QuickAddForm
                    defaultDate={selectedDate}
                    placeholder="Título e hora (ex.: Reunião 14h)"
                    compact
                  />
                </div>
                {selectedItems.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    Nada neste dia.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedItems.map((item) =>
                      item.type === "task" ? (
                        <li key={`t-${(item.data as TaskRow).id}`} className="group">
                          <div className="flex items-center gap-2 p-2 rounded-[var(--radius-sm)] border border-[var(--card-border)] hover:bg-[var(--muted)]/10 transition-colors">
                            <button
                              type="button"
                              onClick={() => quickCompleteTask((item.data as TaskRow).id)}
                              className={`w-5 h-5 rounded flex-shrink-0 transition-colors ${
                                (item.data as TaskRow).status === "done"
                                  ? "bg-[var(--accent)]"
                                  : "border-2 border-[var(--muted)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/20"
                              }`}
                              title="Concluir"
                            />
                            <span
                              className={`
                                w-2 h-2 rounded-full flex-shrink-0
                                ${(item.data as TaskRow).status === "done"
                                  ? "bg-[var(--muted)]"
                                  : (item.data as TaskRow).due_at && new Date((item.data as TaskRow).due_at!) < startOfDay(today)
                                    ? "bg-red-500"
                                    : "bg-[var(--accent)]"}
                              `}
                            />
                            <Link
                              href={`/dashboard/tasks/${(item.data as TaskRow).id}`}
                              className="flex-1 min-w-0 flex items-center gap-2"
                            >
                              <span
                                className={
                                  (item.data as TaskRow).status === "done"
                                    ? "line-through text-[var(--muted)] text-sm"
                                    : "text-sm text-[var(--foreground)]"
                                }
                              >
                                {(item.data as TaskRow).title}
                              </span>
                              {(item.data as TaskRow).due_at && (
                                <span className="text-xs text-[var(--muted)] ml-auto">
                                  {(item.data as TaskRow).starts_at
                                    ? `${new Date((item.data as TaskRow).starts_at!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} – ${new Date((item.data as TaskRow).due_at!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                                    : new Date((item.data as TaskRow).due_at!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </Link>
                            {(item.data as TaskRow).status !== "done" && (item.data as TaskRow).due_at && (
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => quickPostponeTask((item.data as TaskRow).id, (item.data as TaskRow).due_at!)}
                                  className="p-1 rounded-[var(--radius-sm)] text-[var(--muted)] hover:bg-[var(--muted)]/20 transition-colors"
                                  title="Adiar 1h"
                                >
                                  ⏰
                                </button>
                                <button
                                  type="button"
                                  onClick={() => quickMoveToTomorrow((item.data as TaskRow).id, (item.data as TaskRow).due_at!)}
                                  className="p-1 rounded-[var(--radius-sm)] text-[var(--muted)] hover:bg-[var(--muted)]/20 transition-colors"
                                  title="Mover para amanhã"
                                >
                                  📅
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      ) : (
                        <li key={`e-${(item.data as EventRow).id}`}>
                          <div className="flex items-center gap-2 p-2 rounded-[var(--radius-sm)] border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0 bg-blue-500"
                              title="Evento"
                            />
                            <span className="text-sm text-[var(--foreground)]">
                              {(item.data as EventRow).title}
                            </span>
                            <span className="text-xs text-[var(--muted)] ml-auto">
                              {new Date((item.data as EventRow).starts_at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {(item.data as EventRow).ends_at &&
                                ` – ${new Date((item.data as EventRow).ends_at).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`}
                            </span>
                          </div>
                        </li>
                      )
                    )}
                  </ul>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Clique em um dia para ver tarefas e eventos.
              </p>
            )}
          </div>
        </div>
      )}

      {createPopoverDate && (
        <QuickCreatePopover
          date={createPopoverDate}
          onClose={() => setCreatePopoverDate(null)}
          onSaved={() => fetchData()}
        />
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-500" /> Tarefa
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> Evento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Atrasado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-400" /> Concluído
        </span>
      </div>
    </div>
  );
}
