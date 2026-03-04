import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*, project:projects(id, name, color), task_items(*)")
    .eq("id", id)
    .single();

  if (taskError || !task) {
    return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
  }

  const project = Array.isArray(task.project) ? task.project[0] ?? null : task.project ?? null;
  const taskNormalized = { ...task, project };
  const items = (taskNormalized.task_items ?? []).sort(
    (a: { position: number }, b: { position: number }) => a.position - b.position
  );

  const [reposRes, rulesRes, remindersRes] = await Promise.all([
    supabase.from("github_repos").select("id, full_name").order("full_name"),
    supabase
      .from("github_task_rules")
      .select("id, task_id, task_item_id, target_phrase, match_mode, min_score, action_mode, github_repo_id, github_repo:github_repos(full_name)")
      .eq("task_id", id),
    supabase
      .from("reminders")
      .select("id, trigger_at, status")
      .eq("entity_type", "task")
      .eq("entity_id", id)
      .order("trigger_at", { ascending: true }),
  ]);

  const repos = reposRes.data ?? [];
  const rulesData = rulesRes.data ?? [];
  const existingRules = rulesData.map((r: Record<string, unknown>) => {
    const repo = r.github_repo;
    const github_repo =
      repo == null
        ? null
        : Array.isArray(repo)
          ? (repo[0] as { full_name: string }) ?? null
          : (repo as { full_name: string });
    return {
      id: r.id,
      task_id: r.task_id,
      task_item_id: r.task_item_id,
      target_phrase: r.target_phrase,
      match_mode: r.match_mode,
      min_score: r.min_score,
      action_mode: r.action_mode,
      github_repo_id: r.github_repo_id,
      github_repo: github_repo ? { full_name: github_repo.full_name } : null,
    };
  });
  const reminders = remindersRes.data ?? [];

  return NextResponse.json({
    task: { ...taskNormalized, task_items: items },
    repos,
    existingRules,
    reminders,
  });
}
