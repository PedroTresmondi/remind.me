"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TaskDetailClient } from "@/components/tasks/TaskDetailClient";
import { Sheet } from "@/components/ui/Sheet";

type TaskItem = {
  id: string;
  task_id: string;
  title: string;
  normalized_title: string | null;
  is_done: boolean;
  done_at: string | null;
  position: number;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  project_id: string | null;
  project: { id: string; name: string; color: string } | null;
  task_items: TaskItem[];
};

type Repo = { id: string; full_name: string };
type Rule = {
  id: string;
  task_id: string | null;
  task_item_id: string | null;
  target_phrase: string;
  match_mode: string;
  min_score: number;
  action_mode: string;
  github_repo_id: string;
  github_repo: { full_name: string } | null;
};
type ReminderRow = { id: string; trigger_at: string; status: string };

function QuickActionsBar({
  task,
  onClose,
  onUpdate,
}: {
  task: Task;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    const next = task.status === "pending" ? "done" : "pending";
    await supabase
      .from("tasks")
      .update({
        status: next,
        completed_at: next === "done" ? new Date().toISOString() : null,
      })
      .eq("id", task.id);
    router.refresh();
    onUpdate();
    setLoading(false);
  }

  async function remove() {
    if (!confirm("Excluir esta tarefa?")) return;
    setLoading(true);
    await supabase.from("tasks").delete().eq("id", task.id);
    router.refresh();
    onUpdate();
    onClose();
    setLoading(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleStatus}
        disabled={loading}
        className="rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30 transition-colors disabled:opacity-50"
      >
        {task.status === "done" ? "Reabrir" : "✓ Concluir"}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={loading}
        className="rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      >
        🗑 Excluir
      </button>
    </>
  );
}

export function TaskDetailDrawer({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<{
    task: Task;
    repos: Repo[];
    existingRules: Rule[];
    reminders: ReminderRow[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/tasks/${taskId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Tarefa não encontrada");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Erro ao carregar");
        setLoading(false);
      });
  }, [taskId]);

  if (!taskId) return null;

  async function refetch() {
    if (!taskId) return;
    const res = await fetch(`/api/tasks/${taskId}`);
    if (res.ok) setData(await res.json());
  }

  return (
    <Sheet open={!!taskId} onClose={onClose} title="Detalhe da tarefa" headerLeft={data ? <QuickActionsBar task={data.task} onClose={onClose} onUpdate={refetch} /> : undefined}>
      <div className="p-4">
        {taskId && (
          <a
            href={`/dashboard/tasks/${taskId}`}
            className="inline-block text-sm text-[var(--accent)] hover:underline mb-3"
          >
            Abrir em página
          </a>
        )}
        {loading && <p className="text-[var(--muted)] text-sm">Carregando…</p>}
        {error && <p className="text-[var(--danger)] text-sm">{error}</p>}
        {data && !loading && (
          <TaskDetailClient
            task={data.task}
            repos={data.repos}
            existingRules={data.existingRules}
            reminders={data.reminders}
            inDrawer
            onUpdate={refetch}
          />
        )}
      </div>
    </Sheet>
  );
}
