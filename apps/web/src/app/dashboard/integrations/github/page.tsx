import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { GithubRepoList } from "@/components/github/GithubRepoList";

export default async function IntegrationsGithubPage() {
  const supabase = await createClient();
  const { data: repos } = await supabase
    .from("github_repos")
    .select("id, owner, repo, full_name, webhook_enabled")
    .order("full_name");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard/settings" className="text-sm text-teal-600 inline-block">
        ← Configurações
      </Link>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
        Integração GitHub
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Vincule repositórios e associe tarefas ou itens de checklist a commits/releases para
        marcar como concluído automaticamente (auto-tick) ou por sugestão.
      </p>
      <GithubRepoList repos={repos ?? []} />
    </div>
  );
}
