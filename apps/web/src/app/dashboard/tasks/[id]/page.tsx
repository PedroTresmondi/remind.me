import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TaskDetailClient } from "@/components/tasks/TaskDetailClient";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("*, project:projects(id, name, color), task_items(*)")
    .eq("id", id)
    .single();
  if (!task) redirect("/dashboard");

  const items = (task.task_items ?? []).sort(
    (a: { position: number }, b: { position: number }) => a.position - b.position
  );

  const { data: repos } = await supabase
    .from("github_repos")
    .select("id, full_name")
    .order("full_name");
  const { data: rules } = await supabase
    .from("github_task_rules")
    .select("id, task_id, task_item_id, target_phrase, match_mode, min_score, action_mode, github_repo_id, github_repo:github_repos(full_name)")
    .eq("task_id", id);

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard" className="text-sm text-teal-600 mb-2 inline-block">
        ← Dashboard
      </Link>
      <TaskDetailClient
        task={{ ...task, task_items: items }}
        repos={repos ?? []}
        existingRules={rules ?? []}
      />
    </div>
  );
}
