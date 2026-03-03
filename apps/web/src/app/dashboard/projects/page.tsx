import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ProjectsList } from "@/components/projects/ProjectsList";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, category, color")
    .order("name");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
        Projetos
      </h1>
      <ProjectsList initialProjects={projects ?? []} />
    </div>
  );
}
