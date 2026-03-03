import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SmartLists } from "@/components/dashboard/SmartLists";
import { QuickAddForm } from "@/components/quick-add/QuickAddForm";

type DashboardTask = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  priority: string;
  project_id: string | null;
  project: { id: string; name: string; color: string } | null;
};

export default async function DashboardPage() {
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

  const tasks: DashboardTask[] = raw.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    due_at: t.due_at,
    priority: t.priority,
    project_id: t.project_id,
    project: Array.isArray(t.project) ? t.project[0] ?? null : t.project ?? null,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
        Dashboard
      </h1>
      <QuickAddForm defaultHour={9} defaultMinute={0} />
      <SmartLists tasks={tasks} />
      <section>
        <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
          Todas as tarefas
        </h2>
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
                    {new Date(t.due_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
