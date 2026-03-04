"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type QuickCreateType = "task" | "event";

export function QuickCreatePopover({
  date,
  onClose,
  onSaved,
}: {
  date: Date;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [hourStart, setHourStart] = useState(9);
  const [minuteStart, setMinuteStart] = useState(0);
  const [hourEnd, setHourEnd] = useState(10);
  const [minuteEnd, setMinuteEnd] = useState(0);
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [type, setType] = useState<QuickCreateType>("task");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function buildIso(hour: number, minute: number) {
    const d = new Date(date);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }

  function getStartMs() {
    return new Date(date).setHours(hourStart, minuteStart, 0, 0);
  }
  function getEndMs() {
    return new Date(date).setHours(hourEnd, minuteEnd, 0, 0);
  }
  const endAfterStart = getEndMs() > getStartMs();

  function applyDurationMinutes(deltaMinutes: number) {
    const d = new Date(date);
    d.setHours(hourStart, minuteStart + deltaMinutes, 0, 0);
    setHourEnd(d.getHours());
    setMinuteEnd(d.getMinutes());
  }

  const validToSubmit = title.trim() && (allDay || endAfterStart);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const startH = allDay ? 0 : hourStart;
    const startM = allDay ? 0 : minuteStart;
    const endH = allDay ? 23 : hourEnd;
    const endM = allDay ? 59 : minuteEnd;
    if (!allDay && getEndMs() <= getStartMs()) return;
    setSaving(true);
    try {
      const isoStart = buildIso(startH, startM);
      const isoEnd = buildIso(endH, endM);
      if (type === "event") {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;
        if (!userId) return;
        await supabase.from("events").insert({
          user_id: userId,
          title: title.trim(),
          location: location.trim() || null,
          starts_at: isoStart,
          ends_at: isoEnd,
        });
      } else {
        await supabase.from("tasks").insert({
          title: title.trim(),
          starts_at: isoStart,
          due_at: isoEnd,
        });
      }
      onSaved();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const dayLabel = date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="card rounded-[var(--radius)] shadow-[var(--shadow-lg)] w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
          Adicionar em {dayLabel}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="input-base"
          />
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="rounded border-[var(--card-border)] text-[var(--accent)]"
              />
              <span className="text-xs text-[var(--muted)]">Dia inteiro</span>
            </label>
            {!allDay && (
              <>
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-[var(--muted)] w-20">Início:</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={hourStart}
                    onChange={(e) => setHourStart(Number(e.target.value))}
                    className="input-base w-14 px-2 py-1.5 text-sm"
                  />
                  <span className="text-[var(--muted)]">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={minuteStart}
                    onChange={(e) => setMinuteStart(Number(e.target.value))}
                    className="input-base w-14 px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-[var(--muted)] w-20">Fim:</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={hourEnd}
                    onChange={(e) => setHourEnd(Number(e.target.value))}
                    className="input-base w-14 px-2 py-1.5 text-sm"
                  />
                  <span className="text-[var(--muted)]">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={minuteEnd}
                    onChange={(e) => setMinuteEnd(Number(e.target.value))}
                    className="input-base w-14 px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-[var(--muted)] mr-1">Duração:</span>
                  {[30, 60, 120].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => applyDurationMinutes(m)}
                      className="px-2 py-1 rounded-[var(--radius-sm)] text-xs border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--muted)]/10 hover:text-[var(--foreground)]"
                    >
                      {m === 30 ? "30 min" : m === 60 ? "1 h" : "2 h"}
                    </button>
                  ))}
                </div>
                {!endAfterStart && (
                  <p className="text-xs text-[var(--warning)]">O horário de fim deve ser depois do início.</p>
                )}
              </>
            )}
          </div>
          {type === "event" && (
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Local (opcional)"
              className="input-base w-full"
            />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("task")}
              className={`flex-1 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
                type === "task"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--muted)]/20 text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Tarefa
            </button>
            <button
              type="button"
              onClick={() => setType("event")}
              className={`flex-1 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
                type === "event"
                  ? "bg-blue-600 text-white"
                  : "bg-[var(--muted)]/20 text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Evento
            </button>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-[var(--radius-sm)] border border-[var(--card-border)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--muted)]/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || !validToSubmit}
              className="btn-primary flex-1 py-2 text-sm disabled:opacity-50"
            >
              {saving ? "..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
