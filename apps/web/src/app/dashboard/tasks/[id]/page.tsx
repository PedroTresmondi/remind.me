import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TaskDetailClient } from "@/components/tasks/TaskDetailClient";

type RuleForClient = {
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
  const { data: rulesData } = await supabase
    .from("github_task_rules")
    .select("id, task_id, task_item_id, target_phrase, match_mode, min_score, action_mode, github_repo_id, github_repo:github_repos(full_name)")
    .eq("task_id", id);

  const existingRules: RuleForClient[] = (rulesData ?? []).map((r: Record<string, unknown>) => {
    const repo = r.github_repo;
    const github_repo =
      repo == null
        ? null
        : Array.isArray(repo)
          ? (repo[0] as { full_name: string }) ?? null
          : (repo as { full_name: string });
    return {
      id: r.id as string,
      task_id: r.task_id as string | null,
      task_item_id: r.task_item_id as string | null,
      target_phrase: r.target_phrase as string,
      match_mode: r.match_mode as string,
      min_score: r.min_score as number,
      action_mode: r.action_mode as string,
      github_repo_id: r.github_repo_id as string,
      github_repo: github_repo ? { full_name: github_repo.full_name } : null,
    };
  });

  const { data: reminders } = await supabase
    .from("reminders")
    .select("id, trigger_at, status")
    .eq("entity_type", "task")
    .eq("entity_id", id)
    .order("trigger_at", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard" className="text-sm text-teal-600 mb-2 inline-block">
        ← Dashboard
      </Link>
      <TaskDetailClient
        task={{ ...task, task_items: items }}
        repos={repos ?? []}
        existingRules={existingRules}
        reminders={reminders ?? []}
      />
    </div>
  );
}
