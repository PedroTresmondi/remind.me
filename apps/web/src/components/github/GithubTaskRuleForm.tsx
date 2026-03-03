"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { normalizePtBr } from "@/lib/normalization";

type Repo = { id: string; full_name: string };
type Rule = {
  id: string;
  task_id: string | null;
  task_item_id: string | null;
  target_phrase: string;
  match_mode: string;
  min_score: number;
  action_mode: string;
  github_repo_id: string;
  github_repo: Repo | null;
};

const MATCH_MODES = ["explicit_tag", "contains", "all_tokens", "fuzzy"] as const;
type MatchMode = (typeof MATCH_MODES)[number];
const ACTION_MODES = ["auto_tick", "suggest_only"] as const;
type ActionMode = (typeof ACTION_MODES)[number];

export function GithubTaskRuleForm({
  taskId,
  taskItemId,
  repos,
  existingRules,
}: {
  taskId: string;
  taskItemId: string | null;
  repos: Repo[];
  existingRules: Rule[];
}) {
  const [repoId, setRepoId] = useState("");
  const [targetPhrase, setTargetPhrase] = useState("");
  const [matchMode, setMatchMode] = useState<MatchMode>("fuzzy");
  const [actionMode, setActionMode] = useState<ActionMode>("auto_tick");
  const [minScore, setMinScore] = useState(80);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function addRule(e: React.FormEvent) {
    e.preventDefault();
    if (!repoId || !targetPhrase.trim()) return;
    setSaving(true);
    const normalized = normalizePtBr(targetPhrase.trim());
    const { error } = await supabase.from("github_task_rules").insert({
      task_id: taskItemId ? null : taskId,
      task_item_id: taskItemId,
      github_repo_id: repoId,
      target_phrase: targetPhrase.trim(),
      normalized_target_phrase: normalized,
      match_mode: matchMode,
      min_score: minScore,
      action_mode: actionMode,
    });
    setSaving(false);
    if (error) {
      console.error(error);
      return;
    }
    setTargetPhrase("");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
      <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Regra de automação GitHub
      </h3>
      {repos.length === 0 ? (
        <p className="text-sm text-neutral-500">
          <Link href="/dashboard/integrations/github" className="text-teal-600 dark:text-teal-400">
            Adicione um repositório
          </Link>{" "}
          antes de criar regras.
        </p>
      ) : (
        <>
          <ul className="text-sm text-neutral-500 space-y-1">
            {existingRules.map((r) => (
              <li key={r.id}>
                Repo: {r.github_repo?.full_name} — &quot;{r.target_phrase}&quot; ({r.action_mode}, min {r.min_score})
              </li>
            ))}
          </ul>
          <form onSubmit={addRule} className="space-y-2">
            <select
              value={repoId}
              onChange={(e) => setRepoId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
            >
              <option value="">Selecione o repo</option>
              {repos.map((r) => (
                <option key={r.id} value={r.id}>{r.full_name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder='Frase alvo (ex.: "mudar ui" ou slug para #todo:slug)'
              value={targetPhrase}
              onChange={(e) => setTargetPhrase(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
            />
            <div className="flex gap-4 flex-wrap">
              <label className="text-sm">
                Match:{" "}
                <select
                  value={matchMode}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (MATCH_MODES.includes(v as MatchMode)) setMatchMode(v as MatchMode);
                  }}
                  className="ml-1 px-2 py-1 border rounded bg-white dark:bg-neutral-900"
                >
                  <option value="explicit_tag">Tag #todo:slug</option>
                  <option value="contains">Contém</option>
                  <option value="all_tokens">Todos os tokens</option>
                  <option value="fuzzy">Fuzzy</option>
                </select>
              </label>
              <label className="text-sm">
                Ação:{" "}
                <select
                  value={actionMode}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (ACTION_MODES.includes(v as ActionMode)) setActionMode(v as ActionMode);
                  }}
                  className="ml-1 px-2 py-1 border rounded bg-white dark:bg-neutral-900"
                >
                  <option value="auto_tick">Auto-tick</option>
                  <option value="suggest_only">Sugestão</option>
                </select>
              </label>
              <label className="text-sm">
                Min score:{" "}
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-14 px-2 py-1 border rounded bg-white dark:bg-neutral-900 ml-1"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving || !repoId || !targetPhrase.trim()}
              className="px-3 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 text-sm"
            >
              Adicionar regra
            </button>
          </form>
        </>
      )}
    </div>
  );
}
