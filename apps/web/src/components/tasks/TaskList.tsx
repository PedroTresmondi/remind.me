"use client";

import Link from "next/link";

type Task = { id: string; title: string; status: string; due_at: string | null; priority: string };

export function TaskList({ tasks, projectId }: { tasks: Task[]; projectId: string }) {
  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id}>
          <Link
            href={`/dashboard/tasks/${t.id}`}
            className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
          >
            <span
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                t.status === "done" ? "bg-teal-500" : "bg-neutral-300 dark:bg-neutral-600"
              }`}
            />
            <span className={t.status === "done" ? "line-through text-neutral-500" : ""}>
              {t.title}
            </span>
            {t.due_at && (
              <span className="text-xs text-neutral-400 ml-auto">
                {new Date(t.due_at).toLocaleDateString("pt-BR")}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
