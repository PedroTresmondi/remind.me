import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TaskListWithActions } from "@/components/tasks/TaskListWithActions";
import type { ListKey } from "@/components/dashboard/DashboardLists";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  priority: string;
  project_id: string | null;
  project: { id: string; name: string; color: string } | null;
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ list?: string }>;
}) {
  const { list: listParam } = await searchParams;
  const list = listParam && ["hoje", "programado", "todos", "atrasados", "inbox", "sem_data", "concluidos"].includes(listParam)
    ? (listParam as ListKey)
    : null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("id, title, status, due_at, priority, project_id, project:projects(id, name, color)")
    .order("due_at", { nullsFirst: false });

  const raw = (data ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    due_at: string | null;
    priority: string;
    project_id: string | null;
    project: { id: string; name: string; color: string } | { id: string; name: string; color: string }[] | null;
  }>;

  const tasks: TaskRow[] = raw.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    due_at: t.due_at,
    priority: t.priority,
    project_id: t.project_id,
    project: Array.isArray(t.project) ? t.project[0] ?? null : t.project ?? null,
  }));

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard" className="text-sm text-teal-600 dark:text-teal-400 mb-4 inline-block">
        ← Hoje
      </Link>
      {!list && (
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
          Tarefas
        </h1>
      )}
      <TaskListWithActions tasks={tasks} list={list} />
    </div>
  );
}
