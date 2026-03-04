"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { normalizePtBr } from "@/lib/normalization";
import { getTriggerAtForPreset, REMINDER_PRESETS, type ReminderPresetId } from "@/lib/reminder-presets";
import { GithubTaskRuleForm } from "@/components/github/GithubTaskRuleForm";

type TaskItem = {
  id: string;
  task_id: string;
  title: string;
  normalized_title: string | null;
  is_done: boolean;
  done_at: string | null;
  position: number;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  project_id: string | null;
  project: { id: string; name: string; color: string } | null;
  task_items: TaskItem[];
};

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
  github_repo: { full_name: string } | null;
};
type ReminderRow = { id: string; trigger_at: string; status: string };

export function TaskDetailClient({
  task,
  repos = [],
  existingRules = [],
  reminders = [],
  inDrawer = false,
  onUpdate,
}: {
  task: Task;
  repos?: Repo[];
  existingRules?: Rule[];
  reminders?: ReminderRow[];
  inDrawer?: boolean;
  onUpdate?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [newItemTitle, setNewItemTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [reminderPresets, setReminderPresets] = useState<Set<ReminderPresetId>>(new Set(["at_time"]));
  const [addingReminders, setAddingReminders] = useState(false);
  const [githubOpen, setGithubOpen] = useState(!inDrawer);
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [remindersOpen, setRemindersOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.description ?? "");
  const [savingTitle, setSavingTitle] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingDue, setSavingDue] = useState(false);

  const dueDate = task.due_at ? new Date(task.due_at) : null;
  const dueDateStr = dueDate
    ? `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}T${String(dueDate.getHours()).padStart(2, "0")}:${String(dueDate.getMinutes()).padStart(2, "0")}`
    : "";

  useEffect(() => {
    setEditTitle(task.title);
    setEditNotes(task.description ?? "");
  }, [task.id, task.title, task.description]);

  async function saveTitle() {
    const t = editTitle.trim() || task.title;
    if (t === task.title) return;
    setSavingTitle(true);
    await supabase.from("tasks").update({ title: t }).eq("id", task.id);
    router.refresh();
    onUpdate?.();
    setSavingTitle(false);
  }

  async function saveNotes() {
    const v = editNotes.trim();
    if (v === (task.description ?? "")) return;
    setSavingNotes(true);
    await supabase.from("tasks").update({ description: v || null }).eq("id", task.id);
    router.refresh();
    onUpdate?.();
    setSavingNotes(false);
  }

  async function saveDueAt(value: string) {
    if (!value) return;
    setSavingDue(true);
    const iso = new Date(value).toISOString();
    await supabase.from("tasks").update({ due_at: iso }).eq("id", task.id);
    router.refresh();
    onUpdate?.();
    setSavingDue(false);
  }

  async function toggleTaskStatus() {
    const next = task.status === "pending" ? "done" : "pending";
    await supabase
      .from("tasks")
      .update({
        status: next,
        completed_at: next === "done" ? new Date().toISOString() : null,
      })
      .eq("id", task.id);
    router.refresh();
    onUpdate?.();
  }

  async function toggleItem(item: TaskItem) {
    await supabase
      .from("task_items")
      .update({
        is_done: !item.is_done,
        done_at: !item.is_done ? new Date().toISOString() : null,
      })
      .eq("id", item.id);
    router.refresh();
    onUpdate?.();
  }

  async function addChecklistItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    setAdding(true);
    const normalized = normalizePtBr(newItemTitle);
    const maxPos = Math.max(0, ...task.task_items.map((i) => i.position));
    await supabase.from("task_items").insert({
      task_id: task.id,
      title: newItemTitle.trim(),
      normalized_title: normalized,
      position: maxPos + 1,
    });
    setNewItemTitle("");
    setAdding(false);
    router.refresh();
    onUpdate?.();
  }

  function toggleReminderPreset(id: ReminderPresetId) {
    setReminderPresets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function addReminders(e: React.FormEvent) {
    e.preventDefault();
    if (!task.due_at || reminderPresets.size === 0) return;
    setAddingReminders(true);
    const targetIso = task.due_at;
    const toInsert = REMINDER_PRESETS.filter((p) => reminderPresets.has(p.id)).map((p) => ({
      entity_type: "task" as const,
      entity_id: task.id,
      trigger_at: getTriggerAtForPreset(targetIso, p.minutesBefore),
    }));
    for (const row of toInsert) {
      await supabase.from("reminders").insert(row);
    }
    setAddingReminders(false);
    router.refresh();
    onUpdate?.();
  }

  async function removeReminder(reminderId: string) {
    await supabase.from("reminders").delete().eq("id", reminderId);
    router.refresh();
    onUpdate?.();
  }

  return (
    <div className="space-y-4">
      {/* Título editável + status */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggleTaskStatus}
          className={`w-5 h-5 rounded-full flex-shrink-0 mt-1 ${
            task.status === "done" ? "bg-[var(--accent)]" : "border-2 border-[var(--muted)] hover:border-[var(--accent)]"
          }`}
          aria-label={task.status === "done" ? "Reabrir" : "Concluir"}
        />
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={saveTitle}
            disabled={savingTitle}
            className={`w-full bg-transparent border-0 border-b border-transparent hover:border-[var(--card-border)] focus:border-[var(--accent)] focus:outline-none focus:ring-0 py-0.5 text-lg font-semibold ${
              task.status === "done" ? "line-through text-[var(--muted)]" : "text-[var(--foreground)]"
            }`}
            placeholder="Título da tarefa"
          />
          {/* Data/hora editável */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <input
              type="datetime-local"
              value={dueDateStr}
              onChange={(e) => saveDueAt(e.target.value)}
              disabled={savingDue}
              className="input-base py-1.5 text-sm max-w-[200px]"
            />
          </div>
          {/* Projeto */}
          {task.project && (
            <p className="text-sm mt-2">
              <Link
                href={`/dashboard/projects/${task.project.id}`}
                className="text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: task.project.color || "var(--muted)" }}
                />
                {task.project.name}
              </Link>
            </p>
          )}
        </div>
      </div>

      <section>
        <button
          type="button"
          onClick={() => setChecklistOpen((o) => !o)}
          className="flex items-center gap-2 w-full text-left text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] py-1"
        >
          <span className="transition-transform">{checklistOpen ? "▼" : "▶"}</span>
          Checklist {task.task_items.length > 0 && `(${task.task_items.filter((i) => i.is_done).length}/${task.task_items.length})`}
        </button>
        {checklistOpen && (
          <>
        <ul className="space-y-2 mt-2">
          {task.task_items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleItem(item)}
                className={`w-4 h-4 rounded flex-shrink-0 transition-colors ${
                  item.is_done ? "bg-[var(--accent)]" : "border border-[var(--muted)] hover:border-[var(--accent)]"
                }`}
              />
              <span className={item.is_done ? "line-through text-[var(--muted)]" : "text-[var(--foreground)]"}>
                {item.title}
              </span>
            </li>
          ))}
        </ul>
        <form onSubmit={addChecklistItem} className="mt-2 flex gap-2">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Novo item..."
            className="input-base flex-1 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={adding || !newItemTitle.trim()}
            className="btn-primary py-1.5 text-sm disabled:opacity-50"
          >
            Adicionar
          </button>
        </form>
          </>
        )}
      </section>

      <section>
        <button
          type="button"
          onClick={() => setRemindersOpen((o) => !o)}
          className="flex items-center gap-2 w-full text-left text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] py-1"
        >
          <span className="transition-transform">{remindersOpen ? "▼" : "▶"}</span>
          Lembretes
        </button>
        {remindersOpen && (
          <>
        <p className="text-xs text-[var(--muted)] mb-2 mt-2">
          Notificação no horário (ative push em Configurações).
        </p>
        <ul className="space-y-1 mb-3">
          {reminders.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 text-sm py-1">
              <span className={r.status === "sent" ? "text-[var(--muted)]" : "text-[var(--foreground)]"}>
                {new Date(r.trigger_at).toLocaleString("pt-BR")}
                {r.status === "sent" && " (enviado)"}
                {r.status === "pending" && " (agendado)"}
                {r.status === "failed" && " (falhou)"}
              </span>
              <button
                type="button"
                onClick={() => removeReminder(r.id)}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
                title="Excluir lembrete"
              >
                Excluir
              </button>
            </li>
          ))}
          {reminders.length === 0 && (
            <li className="text-sm text-[var(--muted)]">Nenhum lembrete.</li>
          )}
        </ul>
        {task.due_at && (
          <form onSubmit={addReminders} className="space-y-2">
            <p className="text-xs text-[var(--muted)]">Adicionar notificação:</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {REMINDER_PRESETS.map((preset) => (
                <label key={preset.id} className="flex items-center gap-1.5 text-sm cursor-pointer text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={reminderPresets.has(preset.id)}
                    onChange={() => toggleReminderPreset(preset.id)}
                    className="rounded border-[var(--card-border)] text-teal-600"
                  />
                  {preset.label}
                </label>
              ))}
            </div>
            <button
              type="submit"
              disabled={addingReminders || reminderPresets.size === 0}
              className="mt-2 btn-primary text-sm py-1.5 disabled:opacity-50"
            >
              {addingReminders ? "..." : "Agendar lembretes"}
            </button>
          </form>
        )}
        {!task.due_at && (
          <p className="text-xs text-[var(--muted)]">Defina data/hora acima para adicionar lembretes.</p>
        )}
          </>
        )}
      </section>

      <section>
        <button
          type="button"
          onClick={() => setNotesOpen((o) => !o)}
          className="flex items-center gap-2 w-full text-left text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] py-1"
        >
          <span className="transition-transform">{notesOpen ? "▼" : "▶"}</span>
          Notas
        </button>
        {notesOpen && (
          <>
        <textarea
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          onBlur={saveNotes}
          disabled={savingNotes}
          placeholder="Anotações..."
          rows={3}
          className="input-base resize-y min-h-[80px] mt-2"
        />
          </>
        )}
      </section>

      {/* Automação GitHub recolhível */}
      <section>
        <button
          type="button"
          onClick={() => setGithubOpen((o) => !o)}
          className="flex items-center gap-2 w-full text-left text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] py-1"
        >
          <span className="transition-transform">{githubOpen ? "▼" : "▶"}</span>
          Automação GitHub
        </button>
        {githubOpen && (
          <div className="mt-2 pl-4 border-l-2 border-[var(--card-border)]">
            <p className="text-xs text-[var(--muted)] mb-2">
              <Link href="/dashboard/integrations/github" className="text-[var(--accent)] hover:underline">
                Integração GitHub
              </Link>{" "}
              — vincular a commits/releases para auto-tick.
            </p>
            <GithubTaskRuleForm
              taskId={task.id}
              taskItemId={null}
              repos={repos}
              existingRules={existingRules}
            />
          </div>
        )}
      </section>
    </div>
  );
}
