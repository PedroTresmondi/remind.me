"use client";

import { useState } from "react";
import { extractDateTimePtBr } from "@/lib/date-parser";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface QuickAddFormProps {
  defaultHour?: number;
  defaultMinute?: number;
}

export function QuickAddForm({ defaultHour = 9, defaultMinute = 0 }: QuickAddFormProps) {
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<{ title: string; preview: string; confidence: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function handleChange(value: string) {
    setInput(value);
    if (!value.trim()) {
      setPreview(null);
      return;
    }
    const parsed = extractDateTimePtBr(value, defaultHour, defaultMinute);
    setPreview({
      title: parsed.title.trim() || "(sem título)",
      preview: parsed.preview,
      confidence: parsed.confidence,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const parsed = extractDateTimePtBr(input, defaultHour, defaultMinute);
    const title = parsed.title.trim() || input.trim();
    setSaving(true);
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        title,
        due_at: parsed.iso,
        source_text: input.trim(),
        parsed_datetime_confidence: parsed.confidence,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      console.error(error);
      return;
    }
    if (task?.id && parsed.iso) {
      await supabase.from("reminders").insert({
        entity_type: "task",
        entity_id: task.id,
        trigger_at: parsed.iso,
      });
    }
    setInput("");
    setPreview(null);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400">
        Captura rápida (ex.: &quot;Entregar notebook próxima quarta 20h&quot;)
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Descreva a tarefa e quando..."
          className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
        />
        <button
          type="submit"
          disabled={saving || !input.trim()}
          className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? "..." : "Adicionar"}
        </button>
      </div>
      {preview && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Título: <strong>{preview.title}</strong> — Data: {preview.preview}
          {preview.confidence < 0.7 && " (confiança baixa)"}
        </p>
      )}
    </form>
  );
}
