import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [tasksRes, eventsRes, projectsRes, settingsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, project:projects(id, name, color), task_items(*)")
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("*, project:projects(id, name, color)")
      .order("starts_at", { ascending: true }),
    supabase.from("projects").select("*").order("name"),
    supabase.from("user_settings").select("*").single(),
  ]);

  const tasks = (tasksRes.data ?? []).map((t) => {
    const project = Array.isArray(t.project) ? t.project[0] ?? null : t.project ?? null;
    const items = (t.task_items ?? []).sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    );
    const { task_items: _, ...rest } = t;
    return { ...rest, project, task_items: items };
  });

  const events = (eventsRes.data ?? []).map((e) => {
    const project = Array.isArray(e.project) ? e.project[0] ?? null : e.project ?? null;
    const { project: _p, ...rest } = e;
    return { ...rest, project: _p ?? project };
  });

  const payload = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    projects: projectsRes.data ?? [],
    tasks,
    events,
    user_settings: settingsRes.data ?? null,
  };

  return NextResponse.json(payload);
}
