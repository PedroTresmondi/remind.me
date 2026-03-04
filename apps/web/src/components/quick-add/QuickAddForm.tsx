"use client";

import { useState, useEffect, useCallback } from "react";
import { extractDateTimePtBr } from "@/lib/date-parser";
import { getTriggerAtForPreset, REMINDER_PRESETS, type ReminderPresetId } from "@/lib/reminder-presets";
import { suggestQuickAddType, parseProjectFromText, matchProjectSlug, parsePriorityFromText } from "@/lib/quick-add-suggest";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { useSpeechToText } from "@/hooks/useSpeechToText";

type QuickAddType = "task" | "event";

interface QuickAddFormProps {
  defaultHour?: number;
  defaultMinute?: number;
  defaultDate?: Date | null;
  placeholder?: string;
  compact?: boolean;
  /** Tipo inicial (ex.: ao abrir pelo FAB "Tarefa") */
  initialTypeOverride?: QuickAddType | null;
  /** Abrir "Mais opções" (lembretes) ao montar */
  initialMoreOptionsOpen?: boolean;
  /** Chamado após adicionar com sucesso (ex.: fechar sheet) */
  onCloseAfterAdd?: () => void;
}

type Project = { id: string; name: string; color: string };

type PreviewItem =
  | {
      kind: "ok";
      title: string;
      preview: string;
      previewEnd?: string;
      confidence: number;
      iso: string | null;
      type: QuickAddType;
      projectId: string | null;
      projectName: string | null;
    }
  | { kind: "error"; raw: string };

function parseOne(
  value: string,
  projects: Project[],
  typeOverride: QuickAddType | null,
  defaultHour: number,
  defaultMinute: number,
  baseDate: Date | undefined
): PreviewItem {
  try {
    const { projectSlug, titleWithoutProject } = parseProjectFromText(value);
    const { priority: _p, titleWithoutPriority } = parsePriorityFromText(titleWithoutProject);
    const parsed = extractDateTimePtBr(
      titleWithoutPriority,
      baseDate ? baseDate.getHours() : defaultHour,
      baseDate ? baseDate.getMinutes() : defaultMinute,
      baseDate
    );
    const suggestedType = suggestQuickAddType(titleWithoutProject);
    const type: QuickAddType = typeOverride ?? suggestedType;
    const projectId = projectSlug ? matchProjectSlug(projectSlug, projects) : null;
    const projectName = projectId ? projects.find((p) => p.id === projectId)?.name ?? null : null;
    return {
      kind: "ok",
      title: parsed.title.trim() || "(sem título)",
      preview: parsed.preview,
      ...(parsed.previewEnd && { previewEnd: parsed.previewEnd }),
      confidence: parsed.confidence,
      iso: parsed.iso || null,
      type,
      projectId,
      projectName,
    };
  } catch {
    return { kind: "error", raw: value.trim() };
  }
}

function parseOneFull(
  value: string,
  projects: Project[],
  typeOverride: QuickAddType | null,
  defaultHour: number,
  defaultMinute: number,
  baseDate: Date | undefined
) {
  const { projectSlug, titleWithoutProject } = parseProjectFromText(value);
  const { priority, titleWithoutPriority } = parsePriorityFromText(titleWithoutProject);
  const parsed = extractDateTimePtBr(
    titleWithoutPriority,
    baseDate ? baseDate.getHours() : defaultHour,
    baseDate ? baseDate.getMinutes() : defaultMinute,
    baseDate
  );
  const suggestedType = suggestQuickAddType(titleWithoutProject);
  const type: QuickAddType = typeOverride ?? suggestedType;
  const projectId = projectSlug ? matchProjectSlug(projectSlug, projects) : null;
  return { parsed, type, projectId, priority };
}

export function QuickAddForm({
  defaultHour = 9,
  defaultMinute = 0,
  defaultDate = null,
  placeholder = "Reunião amanhã 14h ; Entregar layout sexta 18h ; #faculdade estudar IA quarta 20h",
  compact = false,
  initialTypeOverride = null,
  initialMoreOptionsOpen = false,
  onCloseAfterAdd,
}: QuickAddFormProps) {
  const [input, setInput] = useState("");
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [typeOverride, setTypeOverride] = useState<QuickAddType | null>(initialTypeOverride);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(initialMoreOptionsOpen);
  const [reminderPresets, setReminderPresets] = useState<Set<ReminderPresetId>>(new Set(["at_time"]));
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAddedCount, setLastAddedCount] = useState(0);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [lastAddedType, setLastAddedType] = useState<QuickAddType | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleVoiceResult = useCallback((text: string) => {
    setInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
    setError(null);
  }, []);

  const {
    isSupported: isVoiceSupported,
    isListening,
    start: startVoice,
    stop: stopVoice,
    error: voiceError,
  } = useSpeechToText({
    language: "pt-BR",
    continuous: true,
    onResult: handleVoiceResult,
    onError: (msg) => setError(msg),
  });

  useEffect(() => {
    createClient()
      .from("projects")
      .select("id, name, color")
      .order("name")
      .then(({ data }) => setProjects(data ?? []));
  }, []);

  const baseDate = defaultDate ?? undefined;

  const updatePreviews = useCallback(
    (value: string, override: QuickAddType | null) => {
      const parts = value
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length === 0) {
        setPreviews([]);
        return;
      }
      const list: PreviewItem[] = [];
      for (let i = 0; i < parts.length; i++) {
        const applyOverride = i === 0 ? override : null;
        list.push(parseOne(parts[i], projects, applyOverride, defaultHour, defaultMinute, baseDate));
      }
      setPreviews(list);
    },
    [projects, defaultHour, defaultMinute, baseDate]
  );

  useEffect(() => {
    if (!input.trim()) {
      setPreviews([]);
      return;
    }
    updatePreviews(input, typeOverride);
  }, [input, typeOverride, updatePreviews]);

  function handleChange(value: string) {
    setInput(value);
    setError(null);
    setLastAddedId(null);
    setLastAddedCount(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    if (e.shiftKey) {
      e.preventDefault();
      setMoreOptionsOpen((o) => !o);
      return;
    }
    e.preventDefault();
    if (input.trim()) handleSubmitFromEvent();
  }

  async function handleSubmitFromEvent() {
    if (!input.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const parts = input
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      let count = 0;
      let lastId: string | null = null;
      let lastType: QuickAddType | null = null;

      for (let i = 0; i < parts.length; i++) {
        const override = i === 0 ? typeOverride : null;
        let parsedData: ReturnType<typeof parseOneFull>;
        try {
          parsedData = parseOneFull(
            parts[i],
            projects,
            override,
            defaultHour,
            defaultMinute,
            baseDate
          );
        } catch {
          setError(`Não foi possível interpretar: "${parts[i].slice(0, 40)}${parts[i].length > 40 ? "…" : ""}"`);
          setSaving(false);
          return;
        }
        const { parsed, type, projectId, priority } = parsedData;
        const title = parsed.title.trim() || parts[i];

        if (type === "event") {
          const startsAt = parsed.iso;
          const endsAt = parsed.isoEnd ?? new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();
          const { data: authData } = await supabase.auth.getUser();
          const userId = authData?.user?.id;
          if (!userId) {
            setError("Faça login para criar evento.");
            setSaving(false);
            return;
          }
          const { data: event, error: eventError } = await supabase
            .from("events")
            .insert({
              user_id: userId,
              title,
              starts_at: startsAt,
              ends_at: endsAt,
              project_id: projectId,
            })
            .select("id")
            .single();
          if (eventError) {
            setError(eventError.message || "Erro ao criar evento.");
            setSaving(false);
            return;
          }
          if (event?.id && reminderPresets.size > 0) {
            const toInsert = REMINDER_PRESETS.filter((p) => reminderPresets.has(p.id)).map((p) => ({
              entity_type: "event" as const,
              entity_id: event.id,
              trigger_at: getTriggerAtForPreset(startsAt, p.minutesBefore),
            }));
            for (const row of toInsert) {
              await supabase.from("reminders").insert(row);
            }
          }
          lastId = event.id;
          lastType = "event";
          count++;
        } else {
          const { data: task, error: taskError } = await supabase
            .from("tasks")
            .insert({
              title,
              due_at: parsed.iso || null,
              project_id: projectId,
              priority,
              source_text: parts[i],
              parsed_datetime_confidence: parsed.confidence,
            })
            .select("id")
            .single();
          if (taskError) {
            setError(taskError.message || "Erro ao criar tarefa.");
            setSaving(false);
            return;
          }
          if (task?.id && parsed.iso && reminderPresets.size > 0) {
            const toInsert = REMINDER_PRESETS.filter((p) => reminderPresets.has(p.id)).map((p) => ({
              entity_type: "task" as const,
              entity_id: task.id,
              trigger_at: getTriggerAtForPreset(parsed.iso, p.minutesBefore),
            }));
            for (const row of toInsert) {
              await supabase.from("reminders").insert(row);
            }
          }
          lastId = task.id;
          lastType = "task";
          count++;
        }
      }

      setInput("");
      setPreviews([]);
      setTypeOverride(null);
      setMoreOptionsOpen(false);
      setLastAddedCount(count);
      setLastAddedId(lastId);
      setLastAddedType(lastType);
      router.refresh();
      onCloseAfterAdd?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSubmitFromEvent();
  }

  function toggleReminderPreset(id: ReminderPresetId) {
    setReminderPresets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const firstOk = previews.find((p): p is PreviewItem & { kind: "ok" } => p.kind === "ok");
  const effectiveType = firstOk?.type ?? "task";

  const templateChips = [
    { label: "+ Tarefa hoje", value: "Nova tarefa hoje" },
    { label: "+ Evento amanhã", value: "Evento amanhã 9h" },
    { label: "+ Sem data", value: "Lembrar de algo" },
    { label: "Múltiplos", value: "Reunião amanhã 14h ; Entregar layout sexta 18h" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!compact && (
        <label className="block text-sm font-medium text-[var(--muted)]">
          Adicionar rápido
        </label>
      )}
      <div className="flex gap-2">
        <input
          id="quick-add-input"
          type="text"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input-base flex-1"
          aria-describedby={previews.length ? "quick-add-preview" : undefined}
        />
        {isVoiceSupported && (
          <button
            type="button"
            onClick={() => (isListening ? stopVoice() : startVoice())}
            className={`flex items-center justify-center min-w-[var(--button-height)] min-h-[var(--button-height)] rounded-[var(--radius-sm)] border transition-colors ${
              isListening
                ? "bg-[var(--danger-muted)] border-[var(--danger)] text-[var(--danger)] animate-pulse"
                : "border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
            }`}
            title={isListening ? "Parar gravação" : "Falar (ditado por voz)"}
            aria-label={isListening ? "Parar gravação" : "Ativar microfone para ditado por voz"}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V21h-2v-5.07z" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          disabled={saving || !input.trim()}
          className="btn-primary px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Adicionar (Enter)"
        >
          {saving ? "..." : "✓"}
        </button>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Enter salva · Shift+Enter abre mais opções
        {isVoiceSupported && " · 🎤 Clique no ícone para ditar por voz"}
      </p>

      {!compact && (
        <div className="flex flex-wrap gap-2">
          {templateChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setInput(chip.value);
                handleChange(chip.value);
              }}
              className="rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium border border-[var(--card-border)] text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--foreground)] transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Preview em tempo real: chips por item */}
      {previews.length > 0 && (
        <div id="quick-add-preview" className="space-y-3">
          {previews.map((item, idx) =>
            item.kind === "ok" ? (
              <div
                key={idx}
                className="card rounded-[var(--radius)] p-3 space-y-2 bg-[var(--muted)]/5 border border-[var(--card-border)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (idx === 0) {
                        const next = item.type === "task" ? "event" : "task";
                        setTypeOverride(next);
                      }
                    }}
                    className={idx === 0 ? "cursor-pointer" : ""}
                  >
                    <Badge variant={item.type === "event" ? "info" : "accent"}>
                      {item.type === "event" ? "Evento" : "Tarefa"}
                    </Badge>
                  </button>
                  {item.iso && (
                    <>
                      <Badge variant="default">
                        {item.preview.split(" ")[0]}
                      </Badge>
                      {item.previewEnd ? (
                        <Badge variant="default">
                          {(item.preview.split(" ")[1] ?? "")} → {(item.previewEnd.split(" ")[1] ?? item.previewEnd)}
                        </Badge>
                      ) : (
                        item.preview.includes(" ") && (
                          <Badge variant="default">
                            {item.preview.split(" ")[1]}
                          </Badge>
                        )
                      )}
                    </>
                  )}
                  {item.projectName && (
                    <Badge variant="default">#{item.projectName}</Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--foreground)]">
                  <strong>{item.title}</strong>
                  {item.confidence < 0.7 && (
                    <span className="ml-2 text-xs text-[var(--warning)]">
                      Confiança baixa — revise se precisar.
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <div
                key={idx}
                className="rounded-[var(--radius)] p-3 border border-[var(--warning)]/40 bg-[var(--warning-muted)]"
                role="alert"
              >
                <p className="text-xs font-medium text-[var(--warning)] mb-1">
                  Não foi possível interpretar
                </p>
                <p className="text-sm text-[var(--foreground)] truncate">&quot;{item.raw}&quot;</p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Edite o texto ou use exemplos: &quot;Reunião amanhã 14h&quot;, &quot;#projeto título&quot;
                </p>
              </div>
            )
          )}

          {/* Mais opções (Shift+Enter): lembretes + tipo do primeiro */}
          {moreOptionsOpen && firstOk && (
            <div className="card rounded-[var(--radius)] p-4 space-y-3 bg-[var(--card)] border border-[var(--card-border)]">
              <p className="text-xs font-medium text-[var(--muted)]">Mais opções</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = effectiveType === "task" ? "event" : "task";
                    setTypeOverride(next);
                  }}
                >
                  <Badge variant={effectiveType === "event" ? "info" : "accent"}>
                    {effectiveType === "event" ? "Evento" : "Tarefa"}
                  </Badge>
                </button>
              </div>
              {firstOk.iso && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-xs text-[var(--muted)]">Notificar:</span>
                  {REMINDER_PRESETS.map((preset) => (
                    <label
                      key={preset.id}
                      className="flex items-center gap-1.5 text-xs cursor-pointer text-[var(--foreground)]"
                    >
                      <input
                        type="checkbox"
                        checked={reminderPresets.has(preset.id)}
                        onChange={() => toggleReminderPreset(preset.id)}
                        className="rounded border-[var(--card-border)] text-teal-600 focus:ring-teal-500"
                      />
                      {preset.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      {lastAddedId && (
        <p className="text-sm text-teal-600 dark:text-teal-400">
          {lastAddedCount > 1 ? `${lastAddedCount} itens adicionados.` : "Adicionado."}{" "}
          <button
            type="button"
            onClick={() =>
              router.push(
                lastAddedType === "event" ? "/dashboard/calendar" : `/dashboard/tasks/${lastAddedId}`
              )
            }
            className="underline hover:no-underline font-medium"
          >
            {lastAddedType === "event" ? "Ver calendário" : "Abrir"}
          </button>
        </p>
      )}
    </form>
  );
}
