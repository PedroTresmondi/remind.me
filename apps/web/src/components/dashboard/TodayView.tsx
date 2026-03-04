"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  priority: string;
  project: { id: string; name: string; color: string } | null;
  completed_at?: string | null;
};

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

function getOverdue(tasks: TaskRow[]): TaskRow[] {
  const end = todayStart();
  return tasks.filter((t) => t.status === "pending" && t.due_at && new Date(t.due_at) < end);
}

function getTodayWithTime(tasks: TaskRow[]): TaskRow[] {
  const start = todayStart();
  const end = todayEnd();
  return tasks.filter((t) => {
    if (t.status !== "pending" || !t.due_at) return false;
    const d = new Date(t.due_at);
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
    return hasTime && d >= start && d <= end;
  });
}

function getTodayAllDay(tasks: TaskRow[]): TaskRow[] {
  const start = todayStart();
  const end = todayEnd();
  return tasks.filter((t) => {
    if (t.status !== "pending" || !t.due_at) return false;
    const d = new Date(t.due_at);
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
    return !hasTime && d >= start && d <= end;
  });
}

function getDoneToday(tasks: (TaskRow & { completed_at?: string | null })[]): (TaskRow & { completed_at?: string | null })[] {
  const start = todayStart();
  const end = todayEnd();
  return tasks.filter((t) => {
    if (t.status !== "done" || !t.completed_at) return false;
    const d = new Date(t.completed_at);
    return d >= start && d <= end;
  });
}

export function TodayView({ tasks }: { tasks: (TaskRow & { completed_at?: string | null })[] }) {
  const router = useRouter();
  const [concluidosOpen, setConcluidosOpen] = useState(false);
  const overdue = getOverdue(tasks);
  const todayWithTime = getTodayWithTime(tasks).sort(
    (a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime()
  );
  const todayAllDay = getTodayAllDay(tasks);
  const doneToday = getDoneToday(tasks);

  async function quickComplete(id: string) {
    await createClient()
      .from("tasks")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", id);
    router.refresh();
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const TaskLine = ({ t, showTime = false }: { t: TaskRow; showTime?: boolean }) => (
    <div className="group flex items-center gap-3 py-3 border-b border-[var(--card-border)] last:border-0 last:pb-0 [&:first-child]:pt-0">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          quickComplete(t.id);
        }}
        className={`w-5 h-5 rounded-full flex-shrink-0 transition-colors ${
          t.status === "done"
            ? "bg-[var(--accent)]"
            : "border-2 border-[var(--muted)] hover:border-[var(--accent)]"
        }`}
        aria-label="Concluir"
      />
      <Link href={`/dashboard/tasks/${t.id}`} className="flex-1 min-w-0">
        <span className={t.status === "done" ? "line-through text-[var(--muted)]" : "text-[var(--foreground)]"}>
          {t.title}
        </span>
        {(t.due_at || t.project) && (
          <span className="block text-xs text-[var(--muted)] truncate mt-0.5">
            {showTime && t.due_at && formatTime(t.due_at)}
            {showTime && t.due_at && t.project && " · "}
            {t.project?.name}
          </span>
        )}
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-2">
            Em atraso
          </h2>
          <div className="card rounded-[var(--radius)] overflow-hidden border-red-200/50 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20">
            <div className="px-4">
              {overdue.map((t) => (
                <TaskLine key={t.id} t={t} showTime />
              ))}
            </div>
          </div>
        </section>
      )}

      {(todayWithTime.length > 0 || todayAllDay.length > 0) && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
            Hoje
          </h2>
          <div className="card rounded-[var(--radius)] overflow-hidden">
            <div className="px-4">
              {todayAllDay.length > 0 && (
                <>
                  <p className="text-xs text-[var(--muted)] pt-3 pb-1">
                    Dia inteiro
                  </p>
                  {todayAllDay.map((t) => (
                    <TaskLine key={t.id} t={t} />
                  ))}
                </>
              )}
              {todayWithTime.length > 0 && (
                <>
                  <p className="text-xs text-[var(--muted)] pt-3 pb-1">
                    Horários
                  </p>
                  {todayWithTime.map((t) => (
                    <TaskLine key={t.id} t={t} showTime />
                  ))}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {doneToday.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setConcluidosOpen((o) => !o)}
            className="flex items-center gap-2 w-full text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2 hover:text-[var(--foreground)] transition-colors"
          >
            <span className="transform transition-transform">{concluidosOpen ? "▼" : "▶"}</span>
            Concluídos hoje ({doneToday.length})
          </button>
          {concluidosOpen && (
            <div className="card rounded-[var(--radius)] overflow-hidden bg-[var(--muted)]/10">
              <div className="px-4">
                {doneToday.map((t) => (
                  <TaskLine key={t.id} t={t} showTime />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {overdue.length === 0 && todayWithTime.length === 0 && todayAllDay.length === 0 && doneToday.length === 0 && (
        <div className="card rounded-[var(--radius)] py-12 px-6 text-center">
          <p className="text-[var(--muted)] text-sm">
            Nada para hoje.
          </p>
          <p className="text-[var(--muted)] text-sm mt-1">
            Adicione uma tarefa no campo acima.
          </p>
        </div>
      )}
    </div>
  );
}
