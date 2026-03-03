"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Repo = { id: string; owner: string; repo: string; full_name: string; webhook_enabled: boolean };

export function GithubRepoList({ repos }: { repos: Repo[] }) {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [secret, setSecret] = useState("");
  const [adding, setAdding] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function addRepo(e: React.FormEvent) {
    e.preventDefault();
    const o = owner.trim();
    const r = repo.trim();
    if (!o || !r) return;
    setAdding(true);
    const fullName = `${o}/${r}`;
    const { error } = await supabase.from("github_repos").insert({
      owner: o,
      repo: r,
      webhook_secret_hash: secret.trim() || null,
      webhook_enabled: false,
    });
    setAdding(false);
    if (error) {
      console.error(error);
      return;
    }
    setOwner("");
    setRepo("");
    setSecret("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <section>
        <h2 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
          Adicionar repositório
        </h2>
        <form onSubmit={addRepo} className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="owner (ex: octocat)"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="flex-1 min-w-[120px] px-3 py-2 border rounded-lg bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
            />
            <input
              type="text"
              placeholder="repo (ex: my-repo)"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="flex-1 min-w-[120px] px-3 py-2 border rounded-lg bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
            />
          </div>
          <input
            type="password"
            placeholder="Webhook secret (opcional)"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
          />
          <p className="text-xs text-neutral-400">
            Configure o webhook no GitHub: URL da Edge Function <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">/functions/v1/github-webhook</code>, eventos <em>push</em> e <em>release</em>.
          </p>
          <button
            type="submit"
            disabled={adding || !owner.trim() || !repo.trim()}
            className="px-3 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
          >
            Adicionar repo
          </button>
        </form>
      </section>
      <section>
        <h2 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
          Repositórios vinculados
        </h2>
        <ul className="space-y-2">
          {repos.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700"
            >
              <span className="font-mono text-sm">{r.full_name}</span>
              <span className="text-xs text-neutral-400">
                {r.webhook_enabled ? "Webhook ativo" : "Webhook pendente"}
              </span>
            </li>
          ))}
          {repos.length === 0 && (
            <li className="text-sm text-neutral-400">Nenhum repositório ainda.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
