import { createClient } from "@/lib/supabase/server";
import { HubView } from "@/components/hub/HubView";

type DashboardTask = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  completed_at: string | null;
  priority: string;
  project_id: string | null;
  pinned_at: string | null;
  project: { id: string; name: string; color: string } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("id, title, status, due_at, completed_at, priority, project_id, pinned_at, project:projects(id, name, color)")
    .order("due_at", { nullsFirst: false });

  const raw = (data ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    due_at: string | null;
    completed_at: string | null;
    priority: string;
    project_id: string | null;
    pinned_at: string | null;
    project: { id: string; name: string; color: string } | { id: string; name: string; color: string }[] | null;
  }>;

  const tasks: DashboardTask[] = raw.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    due_at: t.due_at,
    completed_at: t.completed_at,
    priority: t.priority,
    project_id: t.project_id,
    pinned_at: t.pinned_at ?? null,
    project: Array.isArray(t.project) ? t.project[0] ?? null : t.project ?? null,
  }));

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <HubView initialTasks={tasks} />
    </div>
  );
}
