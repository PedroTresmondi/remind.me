import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TaskList } from "@/components/tasks/TaskList";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) redirect("/dashboard/projects");
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, due_at, priority")
    .eq("project_id", id)
    .order("due_at", { nullsFirst: false });

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/projects" className="text-sm text-teal-600 mb-2 inline-block">
        ← Projetos
      </Link>
      <div className="flex items-center gap-3 mb-4">
        <span
          className="w-6 h-6 rounded-full flex-shrink-0"
          style={{ backgroundColor: project.color }}
        />
        <h1 className="text-xl font-semibold">{project.name}</h1>
      </div>
      <TaskList tasks={tasks ?? []} projectId={id} />
    </div>
  );
}
