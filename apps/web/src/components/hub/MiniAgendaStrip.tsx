"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { AgendaEventRow } from "@/components/dashboard/DashboardLists";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  priority?: string;
  project_id?: string | null;
  project?: { id: string; name: string; color: string } | null;
};

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location?: string | null;
};

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDayLabel(date: Date, index: number): string {
  if (index === 0) return "Hoje";
  if (index === 1) return "Amanhã";
  return `${DAYS[date.getDay()]} ${date.getDate()}`;
}

export function MiniAgendaStrip({
  tasks,
  events: eventsProp,
  onTaskClick,
}: {
  tasks: TaskRow[];
  events?: AgendaEventRow[];
  onTaskClick: (taskId: string) => void;
}) {
  const [fetchedEvents, setFetchedEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(eventsProp === undefined);

  useEffect(() => {
    if (eventsProp !== undefined) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);

    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("events")
          .select("id, title, starts_at, ends_at, location")
          .gte("starts_at", start.toISOString())
          .lte("starts_at", end.toISOString())
          .order("starts_at");
        if (!cancelled) setFetchedEvents((data ?? []) as EventRow[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [eventsProp]);

  const events = (eventsProp ?? fetchedEvents) as EventRow[];

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const tasksNext7 = useMemo(() => {
    const end7 = new Date(startToday);
    end7.setDate(end7.getDate() + 7);
    end7.setHours(23, 59, 59, 999);
    return tasks.filter(
      (t) =>
        t.status === "pending" &&
        t.due_at &&
        new Date(t.due_at) >= startToday &&
        new Date(t.due_at) <= end7
    );
  }, [tasks, startToday]);

  const byDay = useMemo(() => {
    const map: Record<
      string,
      { date: Date; dayIndex: number; tasks: TaskRow[]; events: EventRow[] }
    > = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(startToday);
      d.setDate(d.getDate() + i);
      const key = toDateKey(d);
      map[key] = { date: d, dayIndex: i, tasks: [], events: [] };
    }
    tasksNext7.forEach((t) => {
      const key = toDateKey(new Date(t.due_at!));
      if (map[key]) map[key].tasks.push(t);
    });
    events.forEach((e) => {
      const key = toDateKey(new Date(e.starts_at));
      if (map[key]) map[key].events.push(e);
    });
    return map;
  }, [tasksNext7, events, startToday]);

  const orderedDays = useMemo(() => {
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([, v]) => v.tasks.length > 0 || v.events.length > 0);
  }, [byDay]);

  return (
    <section className="mb-6" aria-label="Próximos dias">
      <h2 className="text-sm font-medium text-[var(--muted)] mb-2">Próximos dias</h2>
      {loading && orderedDays.length === 0 ? (
        <p className="text-sm text-[var(--muted)] py-2">Carregando agenda...</p>
      ) : orderedDays.length === 0 ? (
        <p className="text-sm text-[var(--muted)] py-2">
          Nada nos próximos 7 dias. Adicione pelo campo acima ou pelo calendário.
        </p>
      ) : (
        <div className="space-y-3">
          {orderedDays.map(([key, { date, dayIndex, tasks: dayTasks, events: dayEvents }]) => {
            const label = getDayLabel(date, dayIndex);
            const calendarUrl = `/dashboard/calendar?date=${key}`;
            return (
              <div
                key={key}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    {label}
                  </span>
                  <Link
                    href={calendarUrl}
                    className="text-xs text-[var(--accent)] hover:underline"
                  >
                    Ver no calendário
                  </Link>
                </div>
                <ul className="space-y-1">
                  {dayTasks.map((t) => (
                    <li key={`t-${t.id}`}>
                      <button
                        type="button"
                        onClick={() => onTaskClick(t.id)}
                        className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-[var(--radius-sm)] hover:bg-[var(--muted)]/10 transition-colors"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0 bg-[var(--accent)]"
                          title="Tarefa"
                        />
                        <span className="text-sm text-[var(--foreground)] truncate">
                          {t.title}
                        </span>
                        {t.due_at && (
                          <span className="text-xs text-[var(--muted)] ml-auto shrink-0">
                            {new Date(t.due_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                  {dayEvents.map((e) => (
                    <li key={`e-${e.id}`}>
                      <Link
                        href={calendarUrl}
                        className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-[var(--radius-sm)] hover:bg-[var(--muted)]/10 transition-colors"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0 bg-blue-500"
                          title="Evento"
                        />
                        <span className="text-sm text-[var(--foreground)] truncate">
                          {e.title}
                        </span>
                        <span className="text-xs text-[var(--muted)] ml-auto shrink-0">
                          {new Date(e.starts_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {e.ends_at &&
                            ` – ${new Date(e.ends_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
