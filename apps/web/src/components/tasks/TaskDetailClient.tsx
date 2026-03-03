"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { normalizePtBr } from "@/lib/normalization";
import { GithubTaskRuleForm } from "@/components/github/GithubTaskRuleForm";

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

export function TaskDetailClient({
  task,
  repos = [],
  existingRules = [],
}: {
  task: Task;
  repos?: Repo[];
  existingRules?: Rule[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [newItemTitle, setNewItemTitle] = useState("");
  const [adding, setAdding] = useState(false);

  async function toggleTaskStatus() {
    const next = task.status === "pending" ? "done" : "pending";
    await supabase
      .from("tasks")
      .update({
        status: next,
        completed_at: next === "done" ? new Date().toISOString() : null,
      })
      .eq("id", task.id);
    router.refresh();
  }

  async function toggleItem(item: TaskItem) {
    await supabase
      .from("task_items")
      .update({
        is_done: !item.is_done,
        done_at: !item.is_done ? new Date().toISOString() : null,
      })
      .eq("id", item.id);
    router.refresh();
  }

  async function addChecklistItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    setAdding(true);
    const normalized = normalizePtBr(newItemTitle);
    const maxPos = Math.max(0, ...task.task_items.map((i) => i.position));
    await supabase.from("task_items").insert({
      task_id: task.id,
      title: newItemTitle.trim(),
      normalized_title: normalized,
      position: maxPos + 1,
    });
    setNewItemTitle("");
    setAdding(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggleTaskStatus}
          className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 ${
            task.status === "done" ? "bg-teal-500" : "border-2 border-neutral-400"
          }`}
        />
        <div className="flex-1 min-w-0">
          <h1 className={`text-lg font-semibold ${task.status === "done" ? "line-through text-neutral-500" : ""}`}>
            {task.title}
          </h1>
          {task.due_at && (
            <p className="text-sm text-neutral-500 mt-1">
              Prazo: {new Date(task.due_at).toLocaleString("pt-BR")}
            </p>
          )}
          {task.project && (
            <p className="text-sm mt-1">
              <Link
                href={`/dashboard/projects/${task.project.id}`}
                className="text-teal-600 dark:text-teal-400"
              >
                {task.project.name}
              </Link>
            </p>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
          Checklist
        </h2>
        <ul className="space-y-2">
          {task.task_items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleItem(item)}
                className={`w-4 h-4 rounded flex-shrink-0 ${
                  item.is_done ? "bg-teal-500" : "border border-neutral-400"
                }`}
              />
              <span className={item.is_done ? "line-through text-neutral-500" : ""}>
                {item.title}
              </span>
            </li>
          ))}
        </ul>
        <form onSubmit={addChecklistItem} className="mt-2 flex gap-2">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Novo item..."
            className="flex-1 px-2 py-1.5 text-sm border rounded bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
          />
          <button
            type="submit"
            disabled={adding || !newItemTitle.trim()}
            className="px-3 py-1.5 text-sm rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
          >
            Adicionar
          </button>
        </form>
      </section>

      <p className="text-sm">
        <Link href="/dashboard/integrations/github" className="text-teal-600 dark:text-teal-400">
          Integração GitHub
        </Link>{" "}
        — vincular esta tarefa a commits/releases para auto-tick.
      </p>
      <GithubTaskRuleForm
        taskId={task.id}
        taskItemId={null}
        repos={repos}
        existingRules={existingRules}
      />
    </div>
  );
}
