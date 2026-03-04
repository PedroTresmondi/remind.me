"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  project_id: string | null;
  project: { id: string; name: string; color: string } | null;
};

export function InboxTriageView({
  tasks,
  onTaskClick,
  onDone,
}: {
  tasks: TaskRow[];
  onTaskClick: (id: string) => void;
  onDone: () => void;
}) {
  const supabase = createClient();
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const task = tasks[index];
  const hasNext = index < tasks.length - 1;
  const hasPrev = index > 0;

  async function handleComplete() {
    if (!task) return;
    setLoading(true);
    await supabase.from("tasks").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", task.id);
    onDone();
    if (hasNext) setIndex((i) => i + 1);
    else if (hasPrev) setIndex((i) => i - 1);
    setLoading(false);
  }

  async function handleDelete() {
    if (!task || !confirm("Excluir esta tarefa?")) return;
    setLoading(true);
    await supabase.from("tasks").delete().eq("id", task.id);
    onDone();
    if (hasNext) setIndex((i) => i + 1);
    else if (hasPrev) setIndex((i) => i - 1);
    setLoading(false);
  }

  if (tasks.length === 0) return null;

  return (
    <div className="card rounded-[var(--radius)] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--muted)]">
          {index + 1} de {tasks.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={!hasPrev}
            className="p-2 rounded-[var(--radius-sm)] border border-[var(--card-border)] disabled:opacity-40"
            aria-label="Anterior"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(tasks.length - 1, i + 1))}
            disabled={!hasNext}
            className="p-2 rounded-[var(--radius-sm)] border border-[var(--card-border)] disabled:opacity-40"
            aria-label="Próximo"
          >
            →
          </button>
        </div>
      </div>

      <p className="text-lg font-medium text-[var(--foreground)] break-words">
        {task.title}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onTaskClick(task.id)}
          disabled={loading}
          className="py-3 px-4 rounded-[var(--radius-sm)] border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--muted)]/10 text-sm font-medium"
        >
          📅 Definir data
        </button>
        <button
          type="button"
          onClick={() => onTaskClick(task.id)}
          disabled={loading}
          className="py-3 px-4 rounded-[var(--radius-sm)] border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--muted)]/10 text-sm font-medium"
        >
          # Definir projeto
        </button>
        <button
          type="button"
          onClick={() => onTaskClick(task.id)}
          disabled={loading}
          className="py-3 px-4 rounded-[var(--radius-sm)] border border-[var(--info)]/30 bg-[var(--info-muted)] hover:bg-[var(--info)]/20 text-sm font-medium"
        >
          📆 Converter em evento
        </button>
        <button
          type="button"
          onClick={handleComplete}
          disabled={loading}
          className="py-3 px-4 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-medium hover:opacity-90"
        >
          ✓ Concluir
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="py-3 px-4 rounded-[var(--radius-sm)] border border-[var(--danger)]/50 text-[var(--danger)] hover:bg-[var(--danger-muted)] text-sm font-medium"
        >
          🗑 Excluir
        </button>
      </div>
    </div>
  );
}
