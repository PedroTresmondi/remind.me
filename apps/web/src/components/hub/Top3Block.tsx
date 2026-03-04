"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  pinned_at?: string | null;
  project: { id: string; name: string; color: string } | null;
};

export function Top3Block({
  tasks,
  onTaskClick,
  onUnpin,
}: {
  tasks: TaskRow[];
  onTaskClick: (id: string) => void;
  onUnpin: (id: string) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <section className="mb-6" aria-label="Top 3 do dia">
      <h2 className="text-sm font-medium text-[var(--muted)] mb-2">
        Prioridades do dia
      </h2>
      <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card)] divide-y divide-[var(--card-border)]">
        {tasks.slice(0, 3).map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted)]/5 transition-colors"
          >
            <button
              type="button"
              onClick={() => onTaskClick(t.id)}
              className="flex-1 min-w-0 text-left"
            >
              <span className="font-medium text-[var(--foreground)] block truncate">
                {t.title}
              </span>
              {(t.due_at || t.project) && (
                <span className="text-xs text-[var(--muted)]">
                  {t.due_at
                    ? new Date(t.due_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : null}
                  {t.due_at && t.project && " · "}
                  {t.project?.name}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onUnpin(t.id)}
              className="shrink-0 p-2 rounded-[var(--radius-sm)] text-[var(--muted)] hover:bg-[var(--muted)]/20 hover:text-[var(--foreground)]"
              title="Desfixar"
              aria-label="Desfixar das prioridades"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function usePinUnpin() {
  const router = useRouter();
  const supabase = createClient();

  async function setPinned(taskId: string, pinned: boolean) {
    await supabase
      .from("tasks")
      .update({ pinned_at: pinned ? new Date().toISOString() : null })
      .eq("id", taskId);
    router.refresh();
  }

  return { setPinned };
}
